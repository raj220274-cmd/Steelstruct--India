/* Seed section library. Masses for ISMB/ISMC are catalogue values entered from memory of IS 808 tables and are
   marked UNVERIFIED: confirm against IS 808 / manufacturer catalogue (or import your approved CSV) before use.
   Geometric types (flat, round, square, CHS, SHS, RHS, angle) are computed from dimensions by engine.js. */
window.SS_SEED = {
  catalogue: [
    ['ISMB 100','ismb',11.5],['ISMB 125','ismb',13.0],['ISMB 150','ismb',14.9],['ISMB 175','ismb',19.3],['ISMB 200','ismb',25.4],
    ['ISMB 225','ismb',31.2],['ISMB 250','ismb',37.3],['ISMB 300','ismb',44.2],['ISMB 350','ismb',52.4],['ISMB 400','ismb',61.6],
    ['ISMB 450','ismb',72.4],['ISMB 500','ismb',86.9],['ISMB 550','ismb',103.7],['ISMB 600','ismb',122.6],
    ['ISMC 75','ismc',6.8],['ISMC 100','ismc',9.2],['ISMC 125','ismc',12.7],['ISMC 150','ismc',16.4],['ISMC 175','ismc',19.1],
    ['ISMC 200','ismc',22.1],['ISMC 250','ismc',30.4],['ISMC 300','ismc',35.8],['ISMC 350','ismc',42.1],['ISMC 400','ismc',49.4]
  ],
  geometric: [
    ['angle','Equal angle',[['a',50],['b',50],['t',6]],'ISA {a}x{b}x{t}'],
    ['angle','Equal angle',[['a',65],['b',65],['t',6]],'ISA {a}x{b}x{t}'],
    ['angle','Equal angle',[['a',75],['b',75],['t',6]],'ISA {a}x{b}x{t}'],
    ['angle','Equal angle',[['a',100],['b',100],['t',8]],'ISA {a}x{b}x{t}'],
    ['shs','SHS',[['a',40],['t',3]],'SHS {a}x{a}x{t}'],['shs','SHS',[['a',50],['t',3]],'SHS {a}x{a}x{t}'],
    ['shs','SHS',[['a',75],['t',4]],'SHS {a}x{a}x{t}'],['shs','SHS',[['a',100],['t',4]],'SHS {a}x{a}x{t}'],
    ['rhs','RHS',[['a',60],['b',40],['t',3]],'RHS {a}x{b}x{t}'],['rhs','RHS',[['a',100],['b',50],['t',4]],'RHS {a}x{b}x{t}'],
    ['chs','CHS',[['d',60.3],['t',3.2]],'CHS {d}x{t}'],['chs','CHS',[['d',88.9],['t',3.6]],'CHS {d}x{t}'],['chs','CHS',[['d',114.3],['t',3.6]],'CHS {d}x{t}'],
    ['flat','Flat',[['b',50],['t',6]],'FLAT {b}x{t}'],['flat','Flat',[['b',75],['t',8]],'FLAT {b}x{t}'],['flat','Flat',[['b',100],['t',10]],'FLAT {b}x{t}'],
    ['round','Round bar',[['d',12]],'RB {d}'],['round','Round bar',[['d',16]],'RB {d}'],['round','Round bar',[['d',20]],'RB {d}'],
    ['square','Square bar',[['a',16]],'SB {a}'],['square','Square bar',[['a',20]],'SB {a}']
  ]
};
