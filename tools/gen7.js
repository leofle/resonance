// v2 generator (6x6, pitched tiles). 1) grow a board from a tap tile along dangling rays (mutes only where two
// rays cross on the same beat), 2) optionally turn arrows into rotatables, 3) require >= minCov full-coverage
// configs (decoys), 4) assign pitches until the intended config's melody is unique among all full-coverage configs.
// usage: node gen7.js <spec> [seconds]   -> prints a level JSON (rows with pitches + target melody)
const E=require('../engine.js');const N=6;
const DV={'>':[1,0],'<':[-1,0],'^':[0,-1],'v':[0,1]};const A=Object.keys(DV);const R=a=>a[Math.floor(Math.random()*a.length)];
const SPECS={
 l1:{n:[7,7],D:[0,0],M:[0,0],S:0,R:0,cov:[1,1],beats:[7,7]},
 l2:{n:[7,8],D:[0,0],M:[0,0],S:0,R:0,cov:[1,1],beats:[7,8],gaps:true},
 split:{n:[9,11],D:[0,0],M:[0,0],S:.4,R:0,cov:[4,99],beats:[6,8],amb:true},
 branch:{n:[11,13],D:[0,0],M:[0,0],S:.45,R:0,cov:[3,99],beats:[6,8],amb:true},
 hush:{n:[10,12],D:[0,0],M:[1,1],S:.4,R:0,cov:[4,99],beats:[6,8],amb:true},
 delay:{n:[10,12],D:[1,1],M:[1,1],S:.35,R:0,cov:[4,99],beats:[6,8],loadD:true,amb:true},
 turn:{n:[10,12],D:[0,0],M:[0,0],S:.35,R:2,cov:[3,99],beats:[6,8],amb:true},
 chorus:{n:[13,15],D:[1,1],M:[1,1],S:.4,R:1,cov:[3,99],beats:[6,8],loadD:true,amb:true},
 tuning:{n:[12,14],D:[0,0],M:[0,1],S:.4,R:3,cov:[3,99],beats:[6,8],amb:true},
 finale:{n:[14,16],D:[1,1],M:[1,1],S:.4,R:2,cov:[3,99],beats:[6,8],loadD:true,amb:true},
};
const sp=SPECS[process.argv[2]];const T=(+process.argv[3]||60)*1000;
const rowsOf=(g,P)=>g.map((r,y)=>r.map((t,x)=>t==='.'?'.':t+':'+(P?P[y][x]:0)).join(' '));
const G=g=>E.parse({rows:rowsOf(g)});
function dangling(g,tx,ty){const gr=G(g);const {ev}=E.simulate(gr,tx,ty);const out=[];const rung=ev.filter(e=>!e.muted);
 for(const e of rung){const t=g[e.y][e.x];const lag=t[0]==='D'?2:1;const ds=t==='S-'?['<','>']:t==='S|'?['^','v']:[t[t.length-1]];
  for(const d of ds){const [dx,dy]=DV[d];let x=e.x+dx,y=e.y+dy;const cells=[];while(x>=0&&y>=0&&x<N&&y<N&&g[y][x]==='.'){cells.push([x,y]);x+=dx;y+=dy}
   if(!(x>=0&&y>=0&&x<N&&y<N)&&cells.length)out.push({cells,beat:e.beat+lag})}}
 return{out,ok:rung.length===gr.flat().filter(Boolean).length}}
// all configs: returns [{rot:[k..],x,y,res}] for full-coverage ones (pitches applied later)
function rotPos(g){const P=[];g.forEach((r,y)=>r.forEach((t,x)=>{if(t[0]==='R')P.push([x,y])}));return P}
function coverage(g,P){const pos=rotPos(g);const out=[];
 for(let m=0;m<4**pos.length;m++){const gr=E.parse({rows:rowsOf(g,P)});let mm=m;const ks=[];pos.forEach(([x,y])=>{const k=mm%4;mm=Math.floor(mm/4);ks.push(k);for(let i=0;i<k;i++)E.rotate(gr[y][x])});
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(gr[y][x]){const r=E.simulate(gr,x,y);if(r.solved)out.push({ks,x,y,melody:r.melody})}}return out}
const rnd=([a,b])=>a+Math.floor(Math.random()*(b-a+1));
const t0=Date.now();let it=0;
outer:while(Date.now()-t0<T){it++;const n=rnd(sp.n),nD=rnd(sp.D),nM=rnd(sp.M);
 const g=Array.from({length:N},()=>Array(N).fill('.'));const tx=Math.floor(Math.random()*N),ty=Math.floor(Math.random()*N);
 g[ty][tx]=sp.S&&Math.random()<.5?R(['S-','S|']):R(A);let cnt=1,cD=0,cM=0,guard=0;
 while(cnt<n&&guard++<300){const {out}=dangling(g,tx,ty);if(!out.length)break;
  const mc=[];if(cM<nM)for(let i=0;i<out.length;i++)for(let j=i+1;j<out.length;j++)if(out[i].beat===out[j].beat)for(const c of out[i].cells)if(out[j].cells.some(d=>d[0]===c[0]&&d[1]===c[1]))mc.push(c);
  let x,y,t;
  if(mc.length&&Math.random()<.8){[x,y]=R(mc);t='M'+R(A);}
  else{const r=R(out);const cs=sp.gaps?r.cells.slice(1).concat(r.cells.slice(0,1)):r.cells;[x,y]=sp.gaps&&cs.length>1&&Math.random()<.7?R(r.cells.slice(1)):R(r.cells);const left=n-cnt;
   if(nD-cD>0&&Math.random()<Math.max(.25,(nD-cD)/left))t='D'+R(A);else if(Math.random()<sp.S)t=R(['S-','S|']);else t=R(A)}
  // occasionally aim an arrow back at an existing tile to create loops (decoy starts)
  const save=g[y][x];g[y][x]=t;
  if(!dangling(g,tx,ty).ok){g[y][x]=save;continue}
  cnt++;if(t[0]==='D')cD++;if(t[0]==='M')cM++}
 if(cnt<n||cD<nD||cM<nM)continue;
 // close loops: turn some dangling arrows to point at existing tiles if coverage still holds
 const gT=g.map(r=>r.slice());   // intended orientation
 if(sp.R){const ar=[];g.forEach((r,y)=>r.forEach((t,x)=>{if(t.length===1&&t!=='.')ar.push([x,y])}));if(ar.length<sp.R)continue;
  for(let k=0;k<sp.R;k++){const i=Math.floor(Math.random()*ar.length);const [x,y]=ar.splice(i,1)[0];gT[y][x]='R'+g[y][x];g[y][x]='R'+R(A.filter(a=>a!==g[y][x]))}}
 // intended config = rotations that restore gT, tap (tx,ty)
 const pos=rotPos(g);const want=pos.map(([x,y])=>{let d=g[y][x][1],k=0;const ROT={'>':'v','v':'<','<':'^','^':'>'};while(d!==gT[y][x][1]){d=ROT[d];k++}return k});
 const cov=coverage(g,null);if(cov.length<sp.cov[0]||cov.length>sp.cov[1])continue;
 const tgt=cov.find(c=>c.x===tx&&c.y===ty&&c.ks.every((k,i)=>k===want[i]));if(!tgt)continue;
 if(tgt.melody.length<sp.beats[0]||tgt.melody.length>sp.beats[1])continue;
 // pitch assignment
 for(let tries=0;tries<300;tries++){const P=g.map(r=>r.map(()=>Math.floor(Math.random()*E.SCALE.length)));
  const cv=coverage(g,P);const T=cv.find(c=>c.x===tx&&c.y===ty&&c.ks.every((k,i)=>k===want[i]));
  const others=cv.filter(c=>c!==T);if(others.some(c=>E.melodyEq(c.melody,T.melody)))continue;
  // chords must not repeat the same pitch twice (would be inaudible as a chord)
  if(T.melody.some(ch=>new Set(ch).size!==ch.length))continue;
  if(sp.amb&&!others.some(c=>E.chordEq(c.melody[0],T.melody[0])))continue;   // first note alone must not give it away
  if(sp.loadD){let bad=false;g.forEach((r,y)=>r.forEach((t,x)=>{if(bad||t[0]!=='D')return;const g2=g.map(r=>r.slice());g2[y][x]=t[1];if(coverage(g2,P).some(c=>E.melodyEq(c.melody,T.melody)))bad=true}));if(bad)continue}
  console.log(JSON.stringify({rows:rowsOf(g,P),melody:T.melody,cov:cv.length,tiles:cnt,iters:it}));process.exit(0)}}
console.log('none after',it);
