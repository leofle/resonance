// v2: every delay is load-bearing: replacing it with a plain arrow (same pitch) leaves 0 configs that ring all tiles AND play the target melody
const E=require('./levels.js');const {solve}=require('./solve.js');
E.LEVELS.forEach((lv,i)=>lv.rows.forEach((r,y)=>r.split(' ').forEach((t,x)=>{if(t[0]!=='D')return;
 const rows=lv.rows.map((rr,yy)=>yy!==y?rr:rr.split(' ').map((tt,xx)=>xx===x?t.slice(1):tt).join(' '));
 const s=solve({...lv,rows});console.log(`L${i+1} ${lv.name}: D at (${x+1},${y+1}) -> plain arrow: full-coverage ${s.cover.length}, melody matches ${s.match.length} (original ${solve(lv).match.length})`)})));
