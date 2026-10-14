// verifies every delay is load-bearing: D->plain arrow makes the level unsolvable
const E=require('./levels.js');const {solve}=require('./solve.js');
[4,6,9].forEach(i=>{const lv=E.LEVELS[i];lv.rows.forEach((r,y)=>r.split(' ').forEach((t,x)=>{if(t[0]!=='D')return;
 const rows=lv.rows.map((rr,yy)=>yy!==y?rr:rr.split(' ').map((tt,xx)=>xx===x?t[1]:tt).join(' '));
 const all=lv.rows.map(rr=>rr.split(' ').map(tt=>tt[0]==='D'?tt[1]:tt).join(' '));
 console.log(`L${i+1} ${lv.name}: D at row${y+1}col${x+1} -> '${t[1]}': solutions ${solve({rows}).sols.length}; all D removed: ${solve({rows:all}).sols.length}; original ${solve(lv).sols.length}`)}))});
