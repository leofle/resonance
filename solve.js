const E=require('./levels.js');
function trimRows(g){while(g[g.length-1].every(c=>!c))g.pop();while(g[0].every(c=>!c))g.shift();let a=0,b=g[0].length-1;while(g.every(r=>!r[a]))a++;while(g.every(r=>!r[b]))b--;return g.map(r=>r.slice(a,b+1))}
function solve(lv){const base=trimRows(E.parse(lv));const pos=[];base.forEach((r,y)=>r.forEach((c,x)=>{if(c&&E.kind(c)==='rot')pos.push([x,y])}));
 const sols=[];let trials=0;const tiles=base.flat().filter(Boolean).length;
 for(let m=0;m<4**pos.length;m++){const g=trimRows(E.parse(lv));let mm=m;const rs=[];
  pos.forEach(([x,y])=>{const k=mm%4;mm=Math.floor(mm/4);for(let i=0;i<k;i++)E.rotate(g[y][x]);rs.push(k?`(${x+1},${y+1})x${k}CW->${g[y][x].t[1]}`:null)});
  g.forEach((r,y)=>r.forEach((c,x)=>{if(!c)return;trials++;if(E.simulate(g,x,y).solved)sols.push(`tap (${x+1},${y+1})`+(rs.filter(Boolean).length?' after '+rs.filter(Boolean).join(' '):''))}))}
 return{tiles,sols,trials}}
module.exports={solve,trimRows};
if(require.main===module)E.LEVELS.forEach((lv,i)=>{const r=solve(lv);console.log(`${i+1} ${lv.name} | tiles ${r.tiles} | solutions ${r.sols.length} | odds ${r.sols.length}/${r.trials} | ${r.sols.join(' ; ')}`)});
