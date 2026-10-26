/* SteelStruct India — calculation engine (no UI, no storage). Version 0.1.0 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.SSEngine = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';
  const VERSION = '0.1.0';
  const STEEL_DENSITY = 7850; // kg/m3, standard value for structural steel

  const num = (v) => (typeof v === 'number' ? v : parseFloat(v));
  const isPos = (v) => Number.isFinite(num(v)) && num(v) > 0;
  const isNonNeg = (v) => Number.isFinite(num(v)) && num(v) >= 0;

  // Geometric mass (kg/m) for simple shapes. Dimensions in mm.
  function massPerMeter(type, d) {
    const g = (k) => num(d[k]);
    switch (type) {
      case 'flat': return g('b') * g('t') * 1e-6 * STEEL_DENSITY;
      case 'round': return Math.PI / 4 * g('d') * g('d') * 1e-6 * STEEL_DENSITY;
      case 'square': return g('a') * g('a') * 1e-6 * STEEL_DENSITY;
      case 'chs': return Math.PI * (g('d') - g('t')) * g('t') * 1e-6 * STEEL_DENSITY; // exact for a circular tube
      case 'shs': return 2 * g('t') * (2 * g('a') - 2 * g('t')) * 1e-6 * STEEL_DENSITY; // sharp-corner approx
      case 'rhs': return 2 * g('t') * (g('a') + g('b') - 2 * g('t')) * 1e-6 * STEEL_DENSITY; // sharp-corner approx
      case 'angle': return g('t') * (g('a') + g('b') - g('t')) * 1e-6 * STEEL_DENSITY; // fillet-free approx
      default: throw new Error('Unknown geometric type: ' + type);
    }
  }
  const plateMass = (L, W, t) => L * W * t * 1e-9 * STEEL_DENSITY; // mm -> kg

  // Gable (or mono, if ridge=eaves) building take-off. Metres.
  function validateGeometry(g) {
    const errs = [];
    if (!isPos(g.length)) errs.push('Building length (m) must be > 0');
    if (!isPos(g.width)) errs.push('Building width/span (m) must be > 0');
    if (!isPos(g.eaves)) errs.push('Eaves height (m) must be > 0');
    if (!isNonNeg(g.ridge) || num(g.ridge) < num(g.eaves)) errs.push('Ridge height (m) must be >= eaves height');
    if (!isNonNeg(g.overhang)) errs.push('Roof overhang (m) must be >= 0');
    if (!isNonNeg(g.openingsArea)) errs.push('Openings area (sqm) must be >= 0');
    return errs;
  }
  function claddingAreas(g) {
    const errs = validateGeometry(g);
    if (errs.length) return { ok: false, errors: errs };
    const L = num(g.length), W = num(g.width), he = num(g.eaves), hr = num(g.ridge);
    const oh = num(g.overhang), op = num(g.openingsArea);
    const rise = hr - he, half = W / 2;
    const slopeLen = Math.sqrt(half * half + rise * rise);
    const roofArea = 2 * (slopeLen + oh) * (L + 2 * oh);
    const gableTri = 0.5 * W * rise;
    const wallGross = 2 * L * he + 2 * W * he + 2 * gableTri;
    if (op > wallGross) return { ok: false, errors: ['Openings area exceeds gross wall area'] };
    return {
      ok: true,
      roofArea, wallGross, wallNet: wallGross - op,
      slopeAngleDeg: Math.atan2(rise, half) * 180 / Math.PI,
      notes: ['Roof area includes overhang on eaves and gable ends; no ridge/flashing/lap allowance.']
    };
  }

  // Member schedule -> weights. Each row: {mark, grid, section, unitMass, length, qty, cutAllow, scrapPct}
  function validateRow(r) {
    const e = [];
    if (!r.mark) e.push('Mark missing');
    if (!isPos(r.unitMass)) e.push('Unit mass (kg/m) missing/invalid');
    if (!isPos(r.length)) e.push('Length (m) must be > 0');
    if (!Number.isInteger(num(r.qty)) || num(r.qty) < 1) e.push('Qty must be integer >= 1');
    if (r.cutAllow !== '' && r.cutAllow != null && !isNonNeg(r.cutAllow)) e.push('Cutting allowance invalid');
    if (r.scrapPct !== '' && r.scrapPct != null && !isNonNeg(r.scrapPct)) e.push('Scrap % invalid');
    return e;
  }
  function memberWeights(rows) {
    const errors = [], out = [];
    const seen = new Set();
    rows.forEach((r, i) => {
      const e = validateRow(r);
      if (r.mark && seen.has(r.mark)) e.push('Duplicate mark "' + r.mark + '" (possible double count)');
      seen.add(r.mark);
      if (e.length) { errors.push({ row: i + 1, mark: r.mark || '', messages: e }); return; }
      const L = num(r.length), q = num(r.qty), ca = num(r.cutAllow) || 0, sp = num(r.scrapPct) || 0, m = num(r.unitMass);
      const netKg = m * L * q;
      const cutLen = L + ca / 1000; // allowance entered in mm per piece
      const cutKg = m * cutLen * q;
      const grossKg = cutKg * (1 + sp / 100);
      out.push({ mark: r.mark, grid: r.grid || '', section: r.section || '', category: r.category || 'other',
        length: L, qty: q, unitMass: m, cutLength: cutLen, netKg, cutKg, grossKg });
    });
    return { rows: out, errors };
  }
  const sum = (a, k) => a.reduce((s, x) => s + x[k], 0);
  function summarise(rows) {
    const byCat = {};
    rows.forEach((r) => { byCat[r.category] = (byCat[r.category] || 0) + r.netKg; });
    return { netKg: sum(rows, 'netKg'), grossKg: sum(rows, 'grossKg'), byCategory: byCat };
  }

  function plateWeights(plates) {
    const errors = [], out = [];
    plates.forEach((p, i) => {
      const bad = ['len', 'wid', 'thk'].filter((k) => !isPos(p[k])).length || !Number.isInteger(num(p.qty)) || num(p.qty) < 1;
      if (bad) { errors.push({ row: i + 1, mark: p.mark || '', messages: ['Plate L/W/t must be > 0 and qty integer >= 1'] }); return; }
      const unit = plateMass(num(p.len), num(p.wid), num(p.thk));
      out.push({ mark: p.mark, len: num(p.len), wid: num(p.wid), thk: num(p.thk), qty: num(p.qty), unitKg: unit, totalKg: unit * num(p.qty) });
    });
    return { rows: out, errors };
  }

  // Cost: all rates user-supplied. Missing rate => item reported as 'rate missing', not zero-filled silently.
  function cost(q, rates) {
    const items = [];
    const add = (name, qty, unit, rate) => {
      const has = rate !== '' && rate != null && isNonNeg(rate);
      items.push({ name, qty, unit, rate: has ? num(rate) : null, amount: has ? qty * num(rate) : null });
    };
    add('Steel supply', q.steelTonnes, 'MT', rates.supply);
    add('Fabrication', q.steelTonnes, 'MT', rates.fabrication);
    add('Surface prep + painting', q.paintSqm, 'SQM', rates.paint);
    add('GI sheeting (roof+wall) supply & fix', q.sheetSqm, 'SQM', rates.sheet);
    add('Erection', q.steelTonnes, 'MT', rates.erection);
    add('Transport', q.steelTonnes, 'MT', rates.transport);
    const missing = items.filter((i) => i.amount === null).map((i) => i.name);
    const subtotal = items.reduce((s, i) => s + (i.amount || 0), 0);
    const gstPct = isNonNeg(rates.gstPct) ? num(rates.gstPct) : 0;
    return { items, missing, subtotal, gstPct, gst: subtotal * gstPct / 100, total: subtotal * (1 + gstPct / 100) };
  }

  function toCSV(rows) {
    const esc = (v) => { const s = v == null ? '' : String(v); return /[",\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
    return rows.map((r) => r.map(esc).join(',')).join('\r\n');
  }

  // CSV section import. Required: designation,type,mass_kg_per_m. Returns {ok, rows, issues}
  function parseCSV(text) {
    const rows = []; let cur = [], f = '', q = false;
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (q) { if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; } else f += c; }
      else if (c === '"') q = true;
      else if (c === ',') { cur.push(f); f = ''; }
      else if (c === '\n' || c === '\r') { if (c === '\r' && text[i + 1] === '\n') i++; cur.push(f); rows.push(cur); cur = []; f = ''; }
      else f += c;
    }
    if (f !== '' || cur.length) { cur.push(f); rows.push(cur); }
    return rows.filter((r) => r.some((x) => x.trim() !== ''));
  }
  function importSections(text) {
    const t = parseCSV(text), issues = [], rows = [];
    if (!t.length) return { ok: false, rows, issues: ['Empty file'] };
    const h = t[0].map((x) => x.trim().toLowerCase());
    ['designation', 'type', 'mass_kg_per_m'].forEach((k) => { if (!h.includes(k)) issues.push('Missing required column: ' + k); });
    if (issues.length) return { ok: false, rows, issues };
    const idx = (k) => h.indexOf(k);
    const seen = new Set();
    t.slice(1).forEach((r, i) => {
      const row = { designation: (r[idx('designation')] || '').trim(), type: (r[idx('type')] || '').trim().toLowerCase(),
        mass: num(r[idx('mass_kg_per_m')]), area: idx('area_mm2') >= 0 ? num(r[idx('area_mm2')]) : null,
        source: idx('source') >= 0 ? (r[idx('source')] || '').trim() : '', standard: idx('standard') >= 0 ? (r[idx('standard')] || '').trim() : '',
        status: 'Imported — verification pending' };
      const ln = i + 2;
      if (!row.designation) { issues.push('Line ' + ln + ': designation missing'); return; }
      if (seen.has(row.designation)) { issues.push('Line ' + ln + ': duplicate designation ' + row.designation); return; }
      if (!isPos(row.mass)) { issues.push('Line ' + ln + ': invalid mass for ' + row.designation); return; }
      if (row.area != null && Number.isFinite(row.area) && row.area > 0) {
        const implied = row.area * 1e-6 * STEEL_DENSITY;
        if (Math.abs(implied - row.mass) / row.mass > 0.05) issues.push('Line ' + ln + ': ' + row.designation + ' mass vs area inconsistent by >5% (implied ' + implied.toFixed(2) + ' kg/m) — kept, please verify');
      } else row.area = null;
      if (!row.source) issues.push('Line ' + ln + ': ' + row.designation + ' has no source — flagged unverified');
      seen.add(row.designation); rows.push(row);
    });
    return { ok: true, rows, issues };
  }

  return { VERSION, STEEL_DENSITY, massPerMeter, plateMass, validateGeometry, claddingAreas, validateRow,
    memberWeights, summarise, plateWeights, cost, toCSV, parseCSV, importSections };
});
