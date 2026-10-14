// v2.3 generator: decoys that differ from the tune ONLY in pitch.
// Boards are built rotation-symmetric (90° "r4" or 180° "r2"): a start s and its image rot(s) produce chains with the
// same timing, so every decoy in the solution's orbit plays the same number of notes on every beat as the tune.
// Searches symmetric boards, keeps those with >= minDecoys full-coverage decoys (dial starts excluded), picks the solution
// that maximises same-shape decoys, scrambles the dials so each must be turned, then assigns pitches 0..5 so exactly one
// config plays the tune (no doubled chord pitch, a decoy shares the first chord, every delay load-bearing).
// usage: node tools/gen9.js <spec> <seconds> <minDecoys> [sym r4|r2|any]   -> best level JSON found (by same-shape decoys)
const E=require('../engine.js');const N=6;const NP=E.SCALE.length;
const A=['>','v','<','^'];const R1={'>':'v','v':'<','<':'^','^':'>'};
const SPECS={ // tiles per fundamental region, feature counts per region, beats
 split:{max:12,k:[2,6],S:.5,minS:1,chords:1,D:0,M:0,Rr:0,beats:[5,9]},
 branch:{k:[3,5],S:.6,minS:1,chords:2,D:0,M:0,Rr:0,beats:[6,9]},
 hush:{max:16,k:[3,8],minS:1,S:.6,D:0,M:1,Rr:0,beats:[6,9]},
 delay:{k:[3,4],S:.4,D:1,M:[0,1],Rr:0,beats:[6,9]},
 turn:{k:[3,4],S:.35,D:0,M:0,Rr:1,beats:[6,9]},
 chorus:{max:20,k:[3,8],minS:1,S:.5,D:1,M:1,Rr:1,beats:[6,9],r2only:false},
 tuning:{k:[3,4],S:.4,D:0,M:[0,1],Rr:[1,2],beats:[5,9],r2only:true},
 finale:{max:20,k:[4,9],minS:1,S:.5,D:1,M:1,Rr:1,beats:[6,9]},
};
const [,,spn,secs,minDec,symArg='any']=process.argv;const sp=SPECS[spn];const T=+secs*1000,MIN=+minDec;
const rnd=a=>a[Math.floor(Math.random()*a.length)];const ri=([a,b])=>a+Math.floor(Math.random()*(b-a+1));const num=v=>Array.isArray(v)?ri(v):v;
const rotDir=(d,q)=>{for(let i=0;i<q;i++)d=R1[d];return d};
function rotTok(t,q){if(t==='S-')return q%2?'S|':'S-';if(t==='S|')return q%2?'S-':'S|';const d=t[t.length-1];return t.slice(0,-1)+rotDir(d,q)}
const rotXY=([x,y],q)=>{for(let i=0;i<q;i++)[x,y]=[N-1-y,x];return[x,y]};
const shp=m=>m.map(c=>c.length).join(',');
const rowsOf=(g,P)=>g.map((r,y)=>r.map((t,x)=>t==='.'?'.':t+':'+(P?P[y][x]:0)).join(' '));
function configs(g,P,fn){const gr=E.parse({rows:rowsOf(g,P)});const pos=[];gr.forEach((r,y)=>r.forEach((c,x)=>{if(c&&E.kind(c)==='rot')pos.push([x,y])}));
 for(let m=0;m<4**pos.length;m++){const g2=E.parse({rows:rowsOf(g,P)});let mm=m;const ks=pos.map(([x,y])=>{const k=mm%4;mm=Math.floor(mm/4);for(let i=0;i<k;i++)E.rotate(g2[y][x]);return k});
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(g2[y][x]&&E.kind(g2[y][x])!=='rot')fn(g2,x,y,ks)}}
function coverage(g,P){const out=[];configs(g,P,(g2,x,y,ks)=>{const r=E.simulate(g2,x,y);if(r.solved)out.push({x,y,ks,melody:r.melody})});return out}
function build(sym){const g=Array.from({length:N},()=>Array(N).fill('.'));const q=sym==='r4'?[1,2,3]:[2];
 const region=sym==='r4'?[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2]]:[...Array(18).keys()].map(i=>[i%6,Math.floor(i/6)]);
 const k=ri(sp.k);const nD=num(sp.D),nM=num(sp.M),nR=num(sp.Rr);if(nD+nM+nR>k)return null;
 const cells=region.slice().sort(()=>Math.random()-.5).slice(0,k);const types=[];
 for(let i=0;i<nD;i++)types.push('D'+rnd(A));for(let i=0;i<nM;i++)types.push('M'+rnd(A));for(let i=0;i<nR;i++)types.push('R'+rnd(A));
 for(let i=0;i<(sp.minS||0)&&types.length<k;i++)types.push(rnd(['S-','S|']));
 while(types.length<k)types.push(Math.random()<sp.S?rnd(['S-','S|']):rnd(A));types.sort(()=>Math.random()-.5);
 cells.forEach(([x,y],i)=>{g[y][x]=types[i];for(const qq of q){const [a,b]=rotXY([x,y],qq);g[b][a]=rotTok(types[i],qq)}});return g}
const t0=Date.now();let best=null,it=0;
while(Date.now()-t0<T){it++;const sym=symArg==='any'?(sp.r2only?'r2':rnd(['r4','r2'])):symArg;const g=build(sym);if(!g)continue;
 const tiles=g.flat().filter(t=>t!=='.').length;if(sp.max&&tiles>sp.max)continue;
 const cov=coverage(g,null);if(cov.length-1<MIN)continue;
 // best solution candidate: max same-shape decoys
 let tg=null,same=-1;for(const c of cov){if(c.melody.length<sp.beats[0]||c.melody.length>sp.beats[1])continue;if(c.melody.filter(ch=>ch.length>1).length<(sp.chords||0))continue;const s=cov.filter(d=>d!==c&&shp(d.melody)===shp(c.melody)).length;if(s>same){same=s;tg=c}}
 if(!tg)continue;const dec=cov.length-1;
 const score=same/dec+same*.01;if(best&&score<=best.score)continue;
 // scramble dials so the solution needs every dial turned: initial = solution setting rotated back by 1..3
 const pos=[];g.forEach((r,y)=>r.forEach((t,x)=>{if(t[0]==='R')pos.push([x,y])}));const g0=g.map(r=>r.slice());
 pos.forEach(([x,y],i)=>{const solDir=rotDir(g[y][x][1],tg.ks[i]);const k=1+Math.floor(Math.random()*3);g0[y][x]='R'+rotDir(solDir,4-k)});
 const cov0=coverage(g0,null);const want=pos.map(([x,y])=>{let d=g0[y][x][1],k=0;const goal=rotDir(g[y][x][1],tg.ks[pos.findIndex(p=>p[0]===x&&p[1]===y)]);while(d!==goal){d=R1[d];k++}return k});
 const tgt0=cov0.find(c=>c.x===tg.x&&c.y===tg.y&&c.ks.every((k,i)=>k===want[i]));if(!tgt0)continue;
 // pitch assignment
 let found=null;for(let tries=0;tries<400&&!found;tries++){const P=g0.map(r=>r.map(()=>Math.floor(Math.random()*NP)));
  const cv=coverage(g0,P);const Tc=cv.find(c=>c.x===tgt0.x&&c.y===tgt0.y&&c.ks.every((k,i)=>k===tgt0.ks[i]));
  const others=cv.filter(c=>c!==Tc);if(others.some(c=>E.melodyEq(c.melody,Tc.melody)))continue;
  if(Tc.melody.some(ch=>new Set(ch).size!==ch.length))continue;
  if(!others.some(c=>E.chordEq(c.melody[0],Tc.melody[0])))continue;
  let bad=false;g0.forEach((r,y)=>r.forEach((t,x)=>{if(bad||t[0]!=='D')return;const g2=g0.map(r=>r.slice());g2[y][x]=t[1];if(coverage(g2,P).some(c=>E.melodyEq(c.melody,Tc.melody)))bad=true}));if(bad)continue;
  found={rows:rowsOf(g0,P),melody:Tc.melody}}
 if(!found)continue;best={score,...found,sym,tiles,decoys:dec,same,solution:[tgt0.x+1,tgt0.y+1,tgt0.ks]};
 if(same===dec)break}
console.log(best?JSON.stringify(best):'none after '+it);
