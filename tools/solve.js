// v2 solver: every rotation config x every tap. Reports full-coverage configs and melody matches.
const E=require('./levels.js');
function configs(lv,fn){const base=E.parse(lv);const pos=[];base.forEach((r,y)=>r.forEach((c,x)=>{if(c&&E.kind(c)==='rot')pos.push([x,y])}));
 for(let m=0;m<4**pos.length;m++){const g=E.parse(lv);let mm=m;const rs=[];
  pos.forEach(([x,y])=>{const k=mm%4;mm=Math.floor(mm/4);for(let i=0;i<k;i++)E.rotate(g[y][x]);if(k)rs.push(`(${x+1},${y+1}) CW×${k}→${g[y][x].t[1]}`)});
  for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++)if(g[y][x]&&E.kind(g[y][x])!=="rot")fn(g,x,y,rs)}}   // dials can never start a chain
function solve(lv){let trials=0;const cover=[],match=[];const tiles=E.parse(lv).flat().filter(Boolean).length;
 configs(lv,(g,x,y,rs)=>{trials++;const r=E.simulate(g,x,y);const d=`tap (${x+1},${y+1})`+(rs.length?' after '+rs.join(' '):'');
  if(r.solved)cover.push({d,melody:r.melody});if(lv.melody&&E.won(r,lv.melody))match.push(d)});   // v2.12: win = tune right (tiles may stay silent)
 return{tiles,trials,cover,match}}
module.exports={solve,configs};
if(require.main===module)E.LEVELS.forEach((lv,i)=>{const r=solve(lv);
 console.log(`${i+1} ${lv.name} | tiles ${r.tiles} | beats ${lv.melody.length} | full-coverage ${r.cover.length} | melody matches ${r.match.length} | random odds ${r.match.length}/${r.trials} | SOLUTION ${r.match.join(' ; ')}`+(r.cover.length>1?` | decoys: ${r.cover.filter(c=>!r.match.includes(c.d)).map(c=>c.d+' wrong@beat'+(E.firstWrongBeat(c.melody,lv.melody)+1)).join(' ; ')}`:''))});
