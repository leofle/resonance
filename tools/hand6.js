// Hand-design level 6 (Hush): 180°-symmetric boards so every full-coverage start shares one notes-per-beat shape.
// One dial (scrambled), one mute (load-bearing: without it another chain plays the tune), pitches 0..5.
// usage: node tools/hand6.js [seconds]
const E=require('../engine.js');const N=6,NP=E.SCALE.length;
const A=['>','v','<','^'];const R1={'>':'v','v':'<','<':'^','^':'>'};
const rotDir=(d,q)=>{for(let i=0;i<q;i++)d=R1[d];return d};const rnd=a=>a[Math.floor(Math.random()*a.length)];
const rotXY=([x,y])=>[N-1-x,N-1-y];
const rotTok=t=>{if(t==='.')return'.';if(t==='S-')return'S-';if(t==='S|')return'S|';return t.slice(0,-1)+rotDir(t[t.length-1],2)};
const rowsOf=(g,P)=>g.map((r,y)=>r.map((t,x)=>t==='.'?'.':t+':'+(P?P[y][x]:0)).join(' '));
const eqM=(a,b)=>a.length===b.length&&a.every((c,i)=>c.length===b[i].length&&c.every((v,j)=>v===b[i][j]));
function coverage(g){const out=[];const base=E.parse({rows:rowsOf(g)});const pos=[];base.forEach((r,y)=>r.forEach((c,x)=>{if(c&&E.kind(c)==='rot')pos.push([x,y])}));
 for(let m=0;m<4**pos.length;m++){const g2=E.parse({rows:rowsOf(g)});let mm=m;const ks=pos.map(([x,y])=>{const k=mm%4;mm=Math.floor(mm/4);for(let i=0;i<k;i++)E.rotate(g2[y][x]);return k});
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(g2[y][x]&&E.kind(g2[y][x])!=='rot'){const r=E.simulate(g2,x,y);if(r.solved){const ev=r.ev.filter(e=>!e.muted);
   const beats=[];ev.forEach(e=>{(beats[e.beat]=beats[e.beat]||[]).push([e.x,e.y])});for(let i=0;i<beats.length;i++)beats[i]=beats[i]||[];
   out.push({x,y,ks,beats,sig:ev.map(e=>e.beat+':'+e.x+','+e.y).sort().join('|'),shape:beats.map(b=>b.length).join(',')})}}}
 return{out,pos}}
const mel=(beats,P)=>beats.map(b=>b.map(([x,y])=>P[y][x]).sort((a,b)=>a-b));
function build(){const g=Array.from({length:N},()=>Array(N).fill('.'));
 const half=[[0,0],[0,1],[0,2],[1,0],[1,1],[1,2],[2,0],[2,1],[2,2],[3,0],[3,1],[4,0],[3,2],[4,1],[5,0]];
 // pick mute cell whose image is different and in the other half
 const muteCands=half.filter(([x,y])=>{const [a,b]=rotXY([x,y]);return!(a===x&&b===y)});
 const mCell=rnd(muteCands);const mImg=rotXY(mCell);
 const pool=half.filter(c=>!(c[0]===mCell[0]&&c[1]===mCell[1]));
 const n=5+Math.floor(Math.random()*3);const cells=pool.sort(()=>Math.random()-.5).slice(0,n);
 const types=['R'+rnd(A)];if(Math.random()<.5)types.push(rnd(['S-','S|']));while(types.length<n)types.push(rnd(A));
 cells.forEach(([x,y],i)=>{g[y][x]=types[i];const [a,b]=rotXY([x,y]);g[b][a]=rotTok(types[i])});
 g[mCell[1]][mCell[0]]='M'+rnd(A);g[mImg[1]][mImg[0]]=rotTok(g[mCell[1]][mCell[0]]);
 return g}
const T=(+process.argv[2]||300)*1000,t0=Date.now();let tries=0;
while(Date.now()-t0<T){tries++;const g=build();const {out,pos}=coverage(g);if(out.length<4||pos.length!==1)continue;
 let tg=null;for(const c of out){if(c.beats.length<6||c.beats.length>9)continue;if(!c.beats.some(b=>b.length>1))continue;
  if(out.some(d=>d!==c&&d.sig===c.sig))continue;if(out.every(d=>d===c||d.shape===c.shape)){tg=c;break}}
 if(!tg)continue;
 const g0=g.map(r=>r.slice());const goal=pos.map(([x,y],i)=>rotDir(g[y][x][1],tg.ks[i]));
 let wrong=0;pos.forEach(([x,y],i)=>{const k=Math.floor(Math.random()*4);if(k)wrong++;g0[y][x]='R'+rotDir(goal[i],k)});if(!wrong)continue;
 const cov0=coverage(g0);const want=pos.map(([x,y],i)=>{let d=g0[y][x][1],k=0;while(d!==goal[i]){d=R1[d];k++}return k});
 const tg0=cov0.out.find(c=>c.x===tg.x&&c.y===tg.y&&c.ks.every((k,i)=>k===want[i]));if(!tg0)continue;
 if(!cov0.out.every(d=>d===tg0||d.shape===tg0.shape))continue;
 const gM=g0.map(r=>r.slice());gM.forEach((r,y)=>r.forEach((t,x)=>{if(t[0]==='M')gM[y][x]=t[1]}));
 const sigs=new Set(cov0.out.map(d=>d.sig));const alt=coverage(gM).out.filter(d=>!sigs.has(d.sig));if(!alt.length)continue;
 for(let rs=0;rs<60;rs++){const P=g0.map(r=>r.map(()=>Math.floor(Math.random()*NP)));
  for(let it=0;it<6000;it++){const cells=[];g0.forEach((r,y)=>r.forEach((t,x)=>{if(t!=='.')cells.push([x,y])}));
   const [x,y]=rnd(cells);P[y][x]=Math.floor(Math.random()*NP);
   const Tm=mel(tg0.beats,P);if(Tm.some(ch=>new Set(ch).size!==ch.length))continue;
   const others=cov0.out.filter(d=>d!==tg0);const ms=others.map(d=>mel(d.beats,P));
   if(ms.some(m=>eqM(m,Tm)))continue;const m3=ms.filter(m=>m.length>=3&&eqM(m.slice(0,3),Tm.slice(0,3))).length;if(m3<1)continue;
   const fp=P[tg0.y][tg0.x];let sh=0;g0.forEach((r,y)=>r.forEach((t,x)=>{if(t!=='.'&&t[0]!=='R'&&!(x===tg0.x&&y===tg0.y)&&P[y][x]===fp)sh++}));if(sh<2)continue;
   if(!alt.some(d=>eqM(mel(d.beats,P),Tm)))continue;
   console.log(JSON.stringify({name:'Hush',hint:'Striped tiles stay silent unless two rings hit them on the same beat; then they join the chord.',rows:rowsOf(g0,P),melody:Tm,stats:{tiles:g0.flat().filter(t=>t!=='.').length,decoys:others.length,sameShape:others.length,match3:m3,sharedFirst:sh,dials:1,tries}}));process.exit(0)}}
 if(tries%200===0)console.error('tries',tries,'best structures still searching')}
console.log('none after',tries);
