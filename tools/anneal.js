// v2.3: local search that reshapes a level's board so its decoys play the tune's notes-per-beat shape (differ only in pitch).
// Starts from the current board; keeps delay/mute/dial counts (teaching order), >= 1 split if it had one, tile count within
// [n-2, n+4], decoys >= minDecoys, dial starts excluded. Score = sameShapeDecoys - (otherDecoys). Then scrambles dials and
// assigns pitches 0..5 (exactly one config plays the tune, no doubled chord pitch, a decoy shares the first chord, every
// delay load-bearing).  usage: node tools/anneal.js <levelIndex0> <seconds> <minDecoys> [seed-json]
const E=require('../engine.js');const F=require('../final.json');const N=6,NP=E.SCALE.length;
const A=['>','v','<','^'];const R1={'>':'v','v':'<','<':'^','^':'>'};const rotDir=(d,q)=>{for(let i=0;i<q;i++)d=R1[d];return d};
const [,,LI,secs,minDec,seedFile]=process.argv;const lv0=seedFile?require(seedFile):F[+LI];const MIN=+minDec,T=+secs*1000;
const rnd=a=>a[Math.floor(Math.random()*a.length)];const shp=m=>m.map(c=>c.length).join(',');
const tok0=lv0.rows.map(r=>r.split(' ').map(t=>t==='.'?'.':t.split(':')[0]));
const cls=t=>t==='.'?'.':t[0]==='S'?'S':t.length===1?'A':t[0];
const cnt=(g,c)=>g.flat().filter(t=>cls(t)===c).length;
const n0=g=>g.flat().filter(t=>t!=='.').length;const N0=n0(tok0),D0=cnt(tok0,'D'),M0=cnt(tok0,'M'),R0=cnt(tok0,'R'),S0=cnt(tok0,'S');
const chords0=lv0.melody.filter(c=>c.length>1).length;
const rowsOf=(g,P)=>g.map((r,y)=>r.map((t,x)=>t==='.'?'.':t+':'+(P?P[y][x]:0)).join(' '));
function coverage(g,P){const out=[];const base=E.parse({rows:rowsOf(g,P)});const pos=[];base.forEach((r,y)=>r.forEach((c,x)=>{if(c&&E.kind(c)==='rot')pos.push([x,y])}));
 for(let m=0;m<4**pos.length;m++){const g2=E.parse({rows:rowsOf(g,P)});let mm=m;const ks=pos.map(([x,y])=>{const k=mm%4;mm=Math.floor(mm/4);for(let i=0;i<k;i++)E.rotate(g2[y][x]);return k});
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(g2[y][x]&&E.kind(g2[y][x])!=='rot'){const r=E.simulate(g2,x,y);if(r.solved)out.push({x,y,ks,melody:r.melody,sig:r.ev.filter(e=>!e.muted).map(e=>e.beat+':'+e.x+','+e.y).sort().join(' ')})}}return out}
function evalB(g){const cov=coverage(g,null);if(cov.length-1<MIN)return{s:-100+cov.length};let best=null;
 for(const c of cov){if(c.melody.length<5||c.melody.length>9)continue;if(c.melody.filter(ch=>ch.length>1).length<Math.min(chords0,2))continue;
  if(cov.some(d=>d!==c&&d.sig===c.sig))continue;   // a decoy ringing the same tiles on the same beats could never sound different
  const same=cov.filter(d=>d!==c&&shp(d.melody)===shp(c.melody)).length;const s=same-2*(cov.length-1-same);if(!best||s>best.s)best={s,tg:c,same,dec:cov.length-1}}
 return best||{s:-50}}
function mutate(g){const h=g.map(r=>r.slice());const cells=[];const empt=[];h.forEach((r,y)=>r.forEach((t,x)=>(t==='.'?empt:cells).push([x,y])));
 const m=Math.random();
 if(m<.35){const [x,y]=rnd(cells);const t=h[y][x];const c=cls(t);if(c==='S')h[y][x]=t==='S-'?'S|':'S-';else if(c==='A')h[y][x]=Math.random()<.25&&S0?rnd(['S-','S|']):rnd(A);else h[y][x]=c+rnd(A)}
 else if(m<.5){const [x,y]=rnd(cells);if(cls(h[y][x])==='S')h[y][x]=rnd(A)}
 else if(m<.8){const [x,y]=rnd(cells);const [a,b]=rnd(empt);h[b][a]=h[y][x];h[y][x]='.'}
 else if(m<.9){const [a,b]=rnd(empt);h[b][a]=Math.random()<.4&&S0?rnd(['S-','S|']):rnd(A)}
 else{const pl=cells.filter(([x,y])=>'AS'.includes(cls(h[y][x])));if(pl.length){const [x,y]=rnd(pl);h[y][x]='.'}}
 const n=n0(h);if(n<N0-2||n>N0+4||cnt(h,'D')!==D0||cnt(h,'M')!==M0||cnt(h,'R')!==R0||(S0&&cnt(h,'S')<1))return null;return h}
const t0=Date.now();let cur=tok0,ce=evalB(cur),best={g:cur,e:ce};let temp=1.5;
while(Date.now()-t0<T){const h=mutate(cur);if(!h)continue;const e=evalB(h);
 if(e.s>=ce.s||Math.random()<Math.exp((e.s-ce.s)/temp)){cur=h;ce=e;if(e.s>best.e.s&&e.tg)best={g:h,e}}
 temp=Math.max(.15,1.5*(1-(Date.now()-t0)/T));if(Math.random()<.002){cur=best.g;ce=best.e}}
// finalize: scramble dials, pitches
const g=best.g,tg=best.e.tg;if(!tg){console.log('none');process.exit(0)}
for(let attempt=0;attempt<200;attempt++){const pos=[];g.forEach((r,y)=>r.forEach((t,x)=>{if(t[0]==='R')pos.push([x,y])}));const g0=g.map(r=>r.slice());
 const goal=pos.map(([x,y],i)=>rotDir(g[y][x][1],tg.ks[i]));pos.forEach(([x,y],i)=>{g0[y][x]='R'+rotDir(goal[i],4-(1+Math.floor(Math.random()*3)))});
 const want=pos.map(([x,y],i)=>{let d=g0[y][x][1],k=0;while(d!==goal[i]){d=R1[d];k++}return k});
 for(let tries=0;tries<300;tries++){const P=g0.map(r=>r.map(()=>Math.floor(Math.random()*NP)));
  const cv=coverage(g0,P);const Tc=cv.find(c=>c.x===tg.x&&c.y===tg.y&&c.ks.every((k,i)=>k===want[i]));if(!Tc)break;
  const others=cv.filter(c=>c!==Tc);if(others.some(c=>E.melodyEq(c.melody,Tc.melody)))continue;
  if(Tc.melody.some(ch=>new Set(ch).size!==ch.length))continue;
  if(others.length&&!others.some(c=>E.chordEq(c.melody[0],Tc.melody[0])))continue;
  let bad=false;g0.forEach((r,y)=>r.forEach((t,x)=>{if(bad||t[0]!=='D')return;const g2=g0.map(r=>r.slice());g2[y][x]=t[1];if(coverage(g2,P).some(c=>E.melodyEq(c.melody,Tc.melody)))bad=true}));if(bad)continue;
  console.log(JSON.stringify({name:lv0.name,hint:lv0.hint,rows:rowsOf(g0,P),melody:Tc.melody,decoys:best.e.dec,same:best.e.same,tiles:n0(g0)}));process.exit(0)}}
console.log('no pitch assignment');
