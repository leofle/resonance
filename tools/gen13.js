// r4 arrow skeleton (same-shape decoys) + 1–2 special tiles (S/M/D) placed once (not mirrored).
// usage: node tools/gen13.js <spec> <seconds>
const E=require('../engine.js');const N=6,NP=E.SCALE.length;
const A=['>','v','<','^'];const R1={'>':'v','v':'<','<':'^','^':'>'};
const rotDir=(d,q)=>{for(let i=0;i<q;i++)d=R1[d];return d};const rnd=a=>a[Math.floor(Math.random()*a.length)];
const ri=v=>Array.isArray(v)?v[0]+Math.floor(Math.random()*(v[1]-v[0]+1)):v;
const SPECS={
 split:{k:[2,3],R:1,S:1,M:0,D:0,chords:1,lb:'S',beats:[5,10],minDec:3},
 hush:{k:[2,3],R:1,S:0,M:1,D:0,chords:1,lb:'M',beats:[5,10],minDec:3},
 delay:{k:[2,3],R:1,S:0,M:0,D:1,chords:1,lb:'D',beats:[5,10],minDec:3},
 chorus:{k:[2,3],R:1,S:1,M:1,D:1,chords:1,lb:'D',beats:[6,12],minDec:3},
 finale:{k:[3,4],R:1,S:1,M:1,D:1,chords:1,lb:'D',beats:[6,12],minDec:3},
};
const sp=SPECS[process.argv[2]],T=(+process.argv[3]||400)*1000;
const Q=[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]];
const rotXY=([x,y],q)=>{for(let i=0;i<q;i++)[x,y]=[N-1-y,x];return[x,y]};
const rotTok=(t,q)=>{if(t==='.')return t;if(t[0]==='S')return q%2?(t==='S-'?'S|':'S-'):t;return t.slice(0,-1)+rotDir(t[t.length-1],q)};
const cls=t=>t==='.'?'.':t[0]==='S'?'S':t.length===1?'A':t[0];
const rowsOf=(g,P)=>g.map((r,y)=>r.map((t,x)=>t==='.'?'.':t+':'+(P?P[y][x]:0)).join(' '));
const eqM=(a,b)=>a.length===b.length&&a.every((c,i)=>c.length===b[i].length&&c.every((v,j)=>v===b[i][j]));
const mel=(beats,P)=>beats.map(b=>b.map(([x,y])=>P[y][x]).sort((a,b)=>a-b));
function skeleton(q){const g=Array.from({length:N},()=>Array(N).fill('.'));
 q.forEach((t,i)=>{if(t==='.')return;for(let r=0;r<4;r++){const[x,y]=rotXY(Q[i],r);g[y][x]=rotTok(t,r)}});return g}
function randQ(){const k=ri(sp.k);const q=Array(9).fill('.');const types=['R'+rnd(A)];while(types.length<k)types.push(rnd(A));
 [...Array(9).keys()].sort(()=>Math.random()-.5).slice(0,types.length).forEach((c,i)=>q[c]=types[i]);return q}
function placeSpecials(g){const empty=[];g.forEach((r,y)=>r.forEach((t,x)=>{if(t==='.')empty.push([x,y])}));
 const need=[];for(let i=0;i<sp.S;i++)need.push(rnd(['S-','S|']));for(let i=0;i<sp.M;i++)need.push('M'+rnd(A));for(let i=0;i<sp.D;i++)need.push('D'+rnd(A));
 if(need.length>empty.length)return null;const g2=g.map(r=>r.slice());
 [...empty].sort(()=>Math.random()-.5).slice(0,need.length).forEach((p,i)=>g2[p[1]][p[0]]=need[i]);return g2}
function coverage(g){const out=[];const pos=[];const base=E.parse({rows:rowsOf(g)});base.forEach((r,y)=>r.forEach((c,x)=>{if(c&&E.kind(c)==='rot')pos.push([x,y])}));
 for(let m=0;m<4**pos.length;m++){const g2=E.parse({rows:rowsOf(g)});let mm=m;const ks=pos.map(([x,y])=>{const k=mm%4;mm=Math.floor(mm/4);for(let i=0;i<k;i++)E.rotate(g2[y][x]);return k});
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(g2[y][x]&&E.kind(g2[y][x])!=='rot'){const r=E.simulate(g2,x,y);const ev=r.ev.filter(e=>!e.muted);if(r.solved){
   const beats=[];ev.forEach(e=>{(beats[e.beat]=beats[e.beat]||[]).push([e.x,e.y])});for(let i=0;i<beats.length;i++)beats[i]=beats[i]||[];
   out.push({x,y,ks,beats,sig:ev.map(e=>e.beat+':'+e.x+','+e.y).sort().join('|'),shape:beats.map(b=>b.length).join(',')})}}}
 return{out,pos}}
function hasIn(g,x,y){const G=E.parse({rows:rowsOf(g)});for(let yy=0;yy<N;yy++)for(let xx=0;xx<N;xx++)if(G[yy][xx]&&!(xx===x&&yy===y)&&E.targets(G,xx,yy).some(([a,b])=>a===x&&b===y))return true;return false}
function finish(g){const {out,pos}=coverage(g);if(out.length<sp.minDec+1)return null;
 const shapes=new Set(out.map(c=>c.shape));if(shapes.size!==1)return null;
 if(new Set(out.map(c=>c.sig)).size!==out.length)return null;
 for(let attempt=0;attempt<50;attempt++){const tg=rnd(out);
  const goal=pos.map(([x,y],i)=>rotDir(g[y][x][1],tg.ks[i]));const g0=g.map(r=>r.slice());
  let wrong=0;pos.forEach(([x,y],i)=>{const k=Math.floor(Math.random()*4);if(k)wrong++;g0[y][x]='R'+rotDir(goal[i],k)});
  if(pos.length&&!wrong)continue;
  const wantK=pos.map(([x,y],i)=>{let d=g0[y][x][1],k=0;while(d!==goal[i]&&k<4){d=R1[d];k++}return k});
  const cov0=coverage(g0);const tg0=cov0.out.find(c=>c.x===tg.x&&c.y===tg.y&&c.ks.every((k,i)=>k===wantK[i]));if(!tg0)continue;
  const noIn=[];g0.forEach((r,y)=>r.forEach((t,x)=>{if(t!=='.'&&t[0]!=='R'&&!hasIn(g0,x,y))noIn.push([x,y])}));
  const startNo=noIn.some(([x,y])=>x===tg0.x&&y===tg0.y);if(startNo&&noIn.length<3)continue;
  let alt=null;if(sp.lb==='M'){const gM=g0.map(r=>r.slice());gM.forEach((r,y)=>r.forEach((t,x)=>{if(t[0]==='M')gM[y][x]=t[1]}));const sigs=new Set(cov0.out.map(d=>d.sig));alt=coverage(gM).out.filter(d=>!sigs.has(d.sig));if(!alt.length)continue}
  const cells=[];g0.forEach((r,y)=>r.forEach((t,x)=>{if(t!=='.')cells.push([x,y])}));
  const others=cov0.out.filter(d=>!(d.x===tg0.x&&d.y===tg0.y&&d.ks.every((k,i)=>k===tg0.ks[i])));
  for(let rs=0;rs<40;rs++){const P=g0.map(r=>r.map(()=>Math.floor(Math.random()*NP)));
   const cost=()=>{const Tm=mel(tg0.beats,P);let c=0;const ms=others.map(d=>mel(d.beats,P));
    c+=25*ms.filter(m=>eqM(m,Tm)).length;const m3=ms.filter(m=>eqM(m.slice(0,3),Tm.slice(0,3))).length;c+=10*Math.max(0,2-m3);
    const fp=P[tg0.y][tg0.x];let sh=0;cells.forEach(([x,y])=>{if(g0[y][x][0]!=='R'&&!(x===tg0.x&&y===tg0.y)&&P[y][x]===fp)sh++});c+=6*Math.max(0,3-sh);
    c+=5*Tm.filter(ch=>new Set(ch).size!==ch.length).length;
    if(alt&&!alt.some(d=>eqM(mel(d.beats,P),Tm)))c+=12;return{c,m3,sh,Tm}};
   let cur=cost();for(let it=0;it<7000&&cur.c>0;it++){const[x,y]=rnd(cells);const o=P[y][x];P[y][x]=Math.floor(Math.random()*NP);const nc=cost();if(nc.c<=cur.c||Math.random()<.02)cur=nc;else P[y][x]=o}
   if(cur.c)continue;
   const win=gg=>coverage(gg).out.filter(d=>eqM(mel(d.beats,P),cur.Tm)).length;if(win(g0)!==1)continue;
   let lb=true;
   if(sp.lb==='S'||sp.lb==='D'){g0.forEach((r,y)=>r.forEach((t,x)=>{if(!lb||cls(t)!==sp.lb)return;const alts=t[0]==='S'?(t==='S-'?['>','<']:['^','v']):[t[1]];for(const a of alts){const g2=g0.map(rr=>rr.slice());g2[y][x]=a;if(win(g2)>0)lb=false}}))}
   if(sp.lb==='M'){g0.forEach((r,y)=>r.forEach((t,x)=>{if(!lb||t[0]!=='M')return;const g2=g0.map(rr=>rr.slice());g2[y][x]=t[1];if(win(g2)<2)lb=false}))}
   if(!lb)continue;
   return{rows:rowsOf(g0,P),melody:cur.Tm,stats:{tiles:cells.length,decoys:others.length,sameShape:others.filter(d=>d.shape===tg0.shape).length,match3:cur.m3,sharedFirst:cur.sh,dials:pos.length,dialsWrong:wrong,startHasIncoming:!startNo,noIncoming:noIn.length,solution:[tg0.x+1,tg0.y+1,wantK]}}}}
 return null}
const t0=Date.now();let res=null;
while(!res&&Date.now()-t0<T){
  const q=randQ();let g=skeleton(q);g=placeSpecials(g);if(!g)continue;
  // mutate skeleton a bit
  for(let i=0;i<30&&!res;i++){const {out}=coverage(g);const sh=new Set(out.map(c=>c.shape)).size;
   if(sh===1&&out.length>=sp.minDec+1){res=finish(g);if(res)break}
   // mutate: rotate a random arrow or move a special
   const cells=[];g.forEach((r,y)=>r.forEach((t,x)=>{if(t!=='.')cells.push([x,y,t])}));
   if(!cells.length)break;const[x,y,t]=rnd(cells);const g2=g.map(r=>r.slice());
   if(cls(t)==='A'||t[0]==='R'||t[0]==='M'||t[0]==='D')g2[y][x]=t.slice(0,-1)+rnd(A);
   else if(t[0]==='S')g2[y][x]=t==='S-'?'S|':'S-';
   g=g2}}
console.log(res?JSON.stringify(res):'none');
