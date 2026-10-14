// Re-assign pitches (and pick which full-ring config is the solution) on an existing board so it meets the v2.8 rules:
// one winner, >=2 decoys match the first 3 beats, >=3 other non-dial tiles share the first pitch, no doubled chord pitch,
// mute load-bearing (mute->arrow gives a second winner), delay load-bearing (delay->arrow gives none).
// usage: node tools/repitch.js <levelIndex0> <seconds>   (writes final.json on success)
const E=require('../engine.js');const fs=require('fs');const L=require('../final.json');const N=6,NP=E.SCALE.length;
const li=+process.argv[2],T=(+process.argv[3]||120)*1000;const lv=L[li];
const tok=lv.rows.map(r=>r.split(/\s+/).map(t=>t==='.'?'.':t.split(':')[0]));
const rowsOf=(g,P)=>g.map((r,y)=>r.map((t,x)=>t==='.'?'.':t+':'+P[y][x]).join(' '));
const eqM=(a,b)=>a.length===b.length&&a.every((c,i)=>c.length===b[i].length&&c.every((v,j)=>v===b[i][j]));
const rnd=a=>a[Math.floor(Math.random()*a.length)];
function configs(g){const Z=g.map(r=>r.map(()=>0));const base=E.parse({rows:rowsOf(g,Z)});const pos=[];base.forEach((r,y)=>r.forEach((c,x)=>{if(c&&E.kind(c)==='rot')pos.push([x,y])}));const out=[];
 for(let m=0;m<4**pos.length;m++){const g2=E.parse({rows:rowsOf(g,Z)});let mm=m;const ks=pos.map(([x,y])=>{const k=mm%4;mm=Math.floor(mm/4);for(let i=0;i<k;i++)E.rotate(g2[y][x]);return k});
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(g2[y][x]&&E.kind(g2[y][x])!=='rot'){const r=E.simulate(g2,x,y);if(r.solved){const beats=[];r.ev.filter(e=>!e.muted).forEach(e=>{(beats[e.beat]=beats[e.beat]||[]).push([e.x,e.y])});for(let i=0;i<beats.length;i++)beats[i]=beats[i]||[];out.push({x,y,ks,beats})}}}return out}
const mel=(b,P)=>b.map(c=>c.map(([x,y])=>P[y][x]).sort((a,b)=>a-b));
const cov=configs(tok);const cells=[];tok.forEach((r,y)=>r.forEach((t,x)=>{if(t!=='.')cells.push([x,y])}));
const alts=[];if(!process.env.NOLB)tok.forEach((r,y)=>r.forEach((t,x)=>{if(t[0]==='M'||t[0]==='D'){const g2=tok.map(r=>r.slice());g2[y][x]=t[1];alts.push({k:t[0],c:configs(g2)})}}));
const t0=Date.now();
while(Date.now()-t0<T){const tg=rnd(cov);if(tg.ks.every(k=>k===0)&&tg.ks.length){} const others=cov.filter(c=>c!==tg);
 const P=tok.map(r=>r.map(()=>Math.floor(Math.random()*NP)));
 const cost=()=>{const Tm=mel(tg.beats,P);let c=0;const ms=others.map(d=>mel(d.beats,P));c+=25*ms.filter(m=>eqM(m,Tm)).length;
  const m3=ms.filter(m=>eqM(m.slice(0,3),Tm.slice(0,3))).length;c+=10*Math.max(0,2-m3);const fp=P[tg.y][tg.x];let sh=0;
  cells.forEach(([x,y])=>{if(tok[y][x][0]!=='R'&&!(x===tg.x&&y===tg.y)&&P[y][x]===fp)sh++});c+=6*Math.max(0,3-sh);c+=5*Tm.filter(ch=>new Set(ch).size!==ch.length).length;
  if(process.env.TOP){const tp=m=>m.map(c=>c.length?Math.max(...c):-1).join(',');const tt=tp(Tm);c+=8*Math.max(0,+process.env.TOP-ms.filter(m=>!eqM(m,Tm)&&tp(m)===tt).length)}
  for(const a of alts){const w=a.c.filter(d=>eqM(mel(d.beats,P),Tm)).length;if(a.k==='M'&&w<2)c+=12;if(a.k==='D'&&w>0)c+=12*w}return{c,m3,sh,Tm}};
 let cur=cost();for(let it=0;it<8000&&cur.c>0;it++){const[x,y]=rnd(cells);const o=P[y][x];P[y][x]=Math.floor(Math.random()*NP);const nc=cost();if(nc.c<=cur.c||Math.random()<.02)cur=nc;else P[y][x]=o}
 if(!globalThis.BEST||cur.c<globalThis.BEST.c){const ms=others.map(d=>mel(d.beats,P));globalThis.BEST={c:cur.c,m3:cur.m3,sh:cur.sh,dupes:ms.filter(m=>eqM(m,cur.Tm)).length,alts:alts.map(a=>a.k+':'+a.c.filter(d=>eqM(mel(d.beats,P),cur.Tm)).length+'/'+a.c.length),nOthers:others.length}}
 if(cur.c)continue;
 // load orientation: dials keep their current load direction; solution = tg.ks turns from load. Require >=1 turn.
 if(tg.ks.length&&tg.ks.every(k=>k===0))continue;
 lv.rows=rowsOf(tok,P);lv.melody=cur.Tm;fs.writeFileSync('final.json',JSON.stringify(L,null,2)+'\n');
 console.log('L'+(li+1),'ok m3',cur.m3,'shared',cur.sh,'start',tg.x+1,tg.y+1,'turns',tg.ks);process.exit(0)}
console.log("none best",JSON.stringify(globalThis.BEST||null));
