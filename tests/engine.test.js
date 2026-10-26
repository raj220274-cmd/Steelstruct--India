const test = require('node:test');
const assert = require('node:assert');
const E = require('../engine.js');
const close = (a, b, tol = 0.01) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test('massPerMeter: flat 50x6 = 2.355 kg/m (hand calc 300mm2 x 7850)', () => close(E.massPerMeter('flat', { b: 50, t: 6 }), 2.355, 0.001));
test('massPerMeter: round 16 mm = 1.578 kg/m', () => close(E.massPerMeter('round', { d: 16 }), 1.5784, 0.001));
test('massPerMeter: square 20 mm = 3.14 kg/m', () => close(E.massPerMeter('square', { a: 20 }), 3.14, 0.001));
test('massPerMeter: CHS 114.3x3.6 = 9.83 kg/m (hand calc)', () => close(E.massPerMeter('chs', { d: 114.3, t: 3.6 }), 9.828, 0.01));
test('massPerMeter: SHS 50x50x3 sharp-corner = 2*3*(100-6)*7850e-6 = 4.427', () => close(E.massPerMeter('shs', { a: 50, t: 3 }), 4.427, 0.001));
test('massPerMeter: angle 50x50x6 fillet-free = 6*94*7850e-6 = 4.427', () => close(E.massPerMeter('angle', { a: 50, b: 50, t: 6 }), 4.427, 0.001));
test('massPerMeter: unknown type throws', () => assert.throws(() => E.massPerMeter('xyz', {})));
test('plateMass 1000x1000x10 = 78.5 kg', () => close(E.plateMass(1000, 1000, 10), 78.5, 1e-9));

test('claddingAreas: flat roof box 20x10x3 -> roof 200, wall 180', () => {
  const r = E.claddingAreas({ length: 20, width: 10, eaves: 3, ridge: 3, overhang: 0, openingsArea: 0 });
  assert.ok(r.ok); close(r.roofArea, 200, 1e-9); close(r.wallGross, 180, 1e-9); close(r.slopeAngleDeg, 0, 1e-9);
});
test('claddingAreas: ridge 4 m -> roof 2*sqrt(26)*20, gable wall adds 10', () => {
  const r = E.claddingAreas({ length: 20, width: 10, eaves: 3, ridge: 4, overhang: 0, openingsArea: 12 });
  close(r.roofArea, 2 * Math.sqrt(26) * 20, 1e-9); close(r.wallGross, 190, 1e-9); close(r.wallNet, 178, 1e-9);
});
test('claddingAreas rejects ridge < eaves, zero length, excess openings', () => {
  assert.ok(!E.claddingAreas({ length: 20, width: 10, eaves: 3, ridge: 2, overhang: 0, openingsArea: 0 }).ok);
  assert.ok(!E.claddingAreas({ length: 0, width: 10, eaves: 3, ridge: 3, overhang: 0, openingsArea: 0 }).ok);
  assert.ok(!E.claddingAreas({ length: 20, width: 10, eaves: 3, ridge: 3, overhang: 0, openingsArea: 999 }).ok);
});

test('memberWeights: 4 x 6 m @25.4 = 609.6 kg net; cut allowance + scrap applied to gross', () => {
  const r = E.memberWeights([{ mark: 'R1', unitMass: 25.4, length: 6, qty: 4, cutAllow: 50, scrapPct: 2, category: 'ismb' }]);
  assert.equal(r.errors.length, 0);
  close(r.rows[0].netKg, 609.6, 1e-9);
  close(r.rows[0].cutKg, 25.4 * 6.05 * 4, 1e-9);
  close(r.rows[0].grossKg, 25.4 * 6.05 * 4 * 1.02, 1e-9);
});
test('memberWeights: flags missing mass, bad qty, duplicate marks; excludes them', () => {
  const r = E.memberWeights([{ mark: 'A', unitMass: '', length: 3, qty: 1 }, { mark: 'B', unitMass: 5, length: 3, qty: 1.5 },
    { mark: 'C', unitMass: 5, length: 3, qty: 1 }, { mark: 'C', unitMass: 5, length: 3, qty: 1 }]);
  assert.equal(r.rows.length, 1); assert.equal(r.errors.length, 3);
});
test('summarise: totals and category split', () => {
  const r = E.memberWeights([{ mark: 'A', unitMass: 10, length: 2, qty: 1, category: 'x' }, { mark: 'B', unitMass: 5, length: 4, qty: 2, category: 'y' }]);
  const s = E.summarise(r.rows); close(s.netKg, 60, 1e-9); close(s.byCategory.x, 20, 1e-9); close(s.byCategory.y, 40, 1e-9);
});
test('plateWeights: 2 plates 200x200x12 = 2*37.68 kg', () => {
  const r = E.plateWeights([{ mark: 'P1', len: 200, wid: 200, thk: 12, qty: 2 }]);
  close(r.rows[0].totalKg, 2 * 200 * 200 * 12 * 1e-9 * 7850, 1e-9);
  assert.equal(E.plateWeights([{ mark: 'P', len: 0, wid: 1, thk: 1, qty: 1 }]).errors.length, 1);
});

test('cost: missing rates are reported, not zero-filled silently; GST applied', () => {
  const c = E.cost({ steelTonnes: 1, paintSqm: 10, sheetSqm: 100 }, { supply: 60000, gstPct: 18 });
  close(c.items[0].amount, 60000, 1e-9); assert.equal(c.missing.length, 5);
  close(c.total, 60000 * 1.18, 1e-9);
});

test('CSV: toCSV escapes; parseCSV round-trips quotes and commas', () => {
  const csv = E.toCSV([['a,b', 'c"d'], [1, 2]]);
  assert.deepEqual(E.parseCSV(csv), [['a,b', 'c"d'], ['1', '2']]);
});
test('importSections: valid rows, flags missing source, mass/area mismatch, dup, bad mass', () => {
  const t = 'designation,type,mass_kg_per_m,area_mm2,source\nX1,ismb,10,1274,Mill A\nX2,ismb,10,2000,Mill A\nX1,ismb,10,,Mill A\nX3,ismb,-1,,Mill A\nX4,ismb,5,,';
  const r = E.importSections(t);
  assert.ok(r.ok); assert.equal(r.rows.length, 3);
  assert.ok(r.issues.some((i) => /inconsistent/.test(i)));
  assert.ok(r.issues.some((i) => /duplicate/.test(i)));
  assert.ok(r.issues.some((i) => /invalid mass/.test(i)));
  assert.ok(r.issues.some((i) => /no source/.test(i)));
});
test('importSections: missing required column rejected', () => assert.ok(!E.importSections('designation,type\nA,b').ok));
