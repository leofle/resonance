// Naive-solver metric: after ONE failed Play from a full-ring decoy, the player has seen every tile's pitch and the
// "N of M beats right" summary, and the strip shows the top note of each beat. Count the decoys still consistent with
// that: same top-note sequence as the strip AND the same beats-right score against the first Play. Averaged over
// which decoy was played first. (Lower is harder for a counter / easier to deduce; 0 = solved by deduction in 2 Plays.)
// usage: node tools/naive.js
const E=require('../engine.js');const L=require('../final.json');
const top=m=>m.map(c=>c.length?Math.max(...c):-1).join(',');
const right=(a,b)=>b.filter((c,i)=>E.chordEq(a[i]||[],c)).length;
function configs(lv){const g0=E.parse(lv);const pos=[];g0.forEach((r,y)=>r.forEach((c,x)=>{if(c&&E.kind(c)==='rot')pos.push([x,y])}));const out=[];
 for(let m=0;m<4**pos.length;m++){const g=E.parse(lv);let mm=m;pos.forEach(([x,y])=>{const k=mm%4;mm=Math.floor(mm/4);for(let i=0;i<k;i++)E.rotate(g[y][x])});
  for(let y=0;y<6;y++)for(let x=0;x<6;x++)if(g[y][x]&&E.kind(g[y][x])!=='rot'){const r=E.simulate(g,x,y);if(r.solved)out.push(r.melody)}}return out}
const res=L.map((lv,i)=>{const cs=configs(lv),T=lv.melody;const dec=cs.filter(m=>!E.melodyEq(m,T));const topOK=dec.filter(m=>top(m)===top(T));
 let avg=0;if(dec.length){for(const f of dec){const s=right(f,T);avg+=dec.filter(m=>m!==f&&top(m)===top(T)&&right(f,m)===s).length}avg/=dec.length}
 return{level:i+1,decoys:dec.length,stripTopMatch:topOK.length,afterFirstFail:+avg.toFixed(2)}});
console.table(res);if(require.main===module&&process.argv[2]==='--json')console.log(JSON.stringify(res));
