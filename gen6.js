const F={noout:0,short:0,counts:0,s0:0,s2:0,s3:0,load:0};
// Constructive generator (build 4). Grows a board from the tap tile; at each step simulates
// the chain, finds "dangling" rays (rings that leave the board) and places a tile on one.
// A mute is placed only where two dangling rays cross with the SAME arrival beat, so it is
// guaranteed to receive a coincident double ring. Delays shift beats to create such crossings.
// usage: node gen6.js <spec> [seconds]
const E=require('./engine.js');const {trimRows}=require('./solve.js');
const DV={'>':[1,0],'<':[-1,0],'^':[0,-1],'v':[0,1]};const A=Object.keys(DV);const R=a=>a[Math.floor(Math.random()*a.length)];
const SPECS={
 delay:{W:5,H:4,n:[10,12],D:[1,2],M:[1,1],S:.3,R:0,loadD:true},
 hush:{W:5,H:5,n:[11,13],D:[0,0],M:[2,2],S:.35,R:0},
 chorus:{W:6,H:6,n:[16,17],D:[1,2],M:[1,2],S:.4,R:0,loadD:true},
 finale:{W:5,H:5,n:[12,14],D:[1,1],M:[1,2],S:.3,R:2,loadD:true},
};
const sp=SPECS[process.argv[2]];const T=(+process.argv[3]||60)*1000;
const G=rows=>E.parse({rows});const rowsOf=g=>g.map(r=>r.join(' '));
function dangling(g,tx,ty){const gr=G(rowsOf(g));const {ev,solved}=E.simulate(gr,tx,ty);const out=[];
 const rung=ev.filter(e=>!e.muted);
 for(const e of rung){const t=g[e.y][e.x];const lag=t[0]==='D'?2:1;const ds=t==='S-'?['<','>']:t==='S|'?['^','v']:[t[t.length-1]];
  for(const d of ds){const [dx,dy]=DV[d];let x=e.x+dx,y=e.y+dy;const cells=[];while(x>=0&&y>=0&&x<sp.W&&y<sp.H&&g[y][x]==='.'){cells.push([x,y]);x+=dx;y+=dy}
   if(!(x>=0&&y>=0&&x<sp.W&&y<sp.H)&&cells.length)out.push({cells,beat:e.beat+lag})}}
 return{out,ok:rung.length===gr.flat().filter(Boolean).length}}
function sols(rows){const base=trimRows(G(rows));const pos=[];base.forEach((r,y)=>r.forEach((c,x)=>{if(c&&E.kind(c)==='rot')pos.push([x,y])}));
 let s=0,tr=0;for(let m=0;m<4**pos.length;m++){const g=trimRows(G(rows));let mm=m;pos.forEach(([x,y])=>{const k=mm%4;mm=Math.floor(mm/4);for(let i=0;i<k;i++)E.rotate(g[y][x])});
  for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++)if(g[y][x]){tr++;if(E.simulate(g,x,y).solved)s++}}return{s,tr}}
const rnd=([a,b])=>a+Math.floor(Math.random()*(b-a+1));
const t0=Date.now();let it=0;
outer:while(Date.now()-t0<T){it++;const n=rnd(sp.n),nD=rnd(sp.D),nM=rnd(sp.M);
 const g=Array.from({length:sp.H},()=>Array(sp.W).fill('.'));const tx=Math.floor(Math.random()*sp.W),ty=Math.floor(Math.random()*sp.H);
 g[ty][tx]=Math.random()<.5?R(['S-','S|']):R(A);let cnt=1,cD=0,cM=0,guard=0;
 while(cnt<n&&guard++<200){const {out}=dangling(g,tx,ty);if(!out.length){F.noout++;break};
  // mute candidates: cells shared by two dangling rays with equal beat
  const mc=[];if(cM<nM)for(let i=0;i<out.length;i++)for(let j=i+1;j<out.length;j++)if(out[i].beat===out[j].beat)for(const c of out[i].cells)if(out[j].cells.some(d=>d[0]===c[0]&&d[1]===c[1]))mc.push(c);
  let x,y,t;
  if(mc.length&&Math.random()<.8){[x,y]=R(mc);t='M'+R(A);}
  else{const r=R(out);[x,y]=R(r.cells);const left=n-cnt;
   const needD=nD-cD,needM=nM-cM;
   if(needD>0&&Math.random()<Math.max(.25,needD/left))t='D'+R(A);else if(Math.random()<sp.S)t=R(['S-','S|']);else t=R(A)}
  const save=g[y][x];g[y][x]=t;
  if(!dangling(g,tx,ty).ok){g[y][x]=save;continue}
  cnt++;if(t[0]==='D')cD++;if(t[0]==='M')cM++}
 if(cnt<n||cD<nD||cM<nM){F[cnt<n?"short":"counts"]++;continue}
 // a finished board leaves rings dangling off-board: fine (they just leave). Rotatables:
 if(sp.R){const ar=[];g.forEach((r,y)=>r.forEach((t,x)=>{if(t.length===1)ar.push([x,y])}));if(ar.length<sp.R)continue;
  for(let k=0;k<sp.R;k++){const i=Math.floor(Math.random()*ar.length);const [x,y]=ar.splice(i,1)[0];let d=g[y][x];const o=A.filter(a=>a!==d);g[y][x]='R'+R(o)}}
 const rows=rowsOf(g);const {s,tr}=sols(rows);if(s!==1){F["s"+Math.min(s,3)]++;continue}
 if(sp.loadD){let ok=true;g.forEach((r,y)=>r.forEach((t,x)=>{if(ok&&t[0]==='D'){const g2=g.map(r=>r.slice());g2[y][x]=t[1];if(sols(rowsOf(g2)).s!==0)ok=false}}));if(!ok){F.load++;continue}}
 console.log(JSON.stringify({rows,tiles:cnt,odds:s+'/'+tr,iters:it}));process.exit(0)}
console.log(it,F);
