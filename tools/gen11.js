// v2.8 generator: 90°-rotation-symmetric boards (quarter is mirrored 4x), so wrong full-ring configurations come in
// orbits that share the solution's timing: EVERY decoy has the tune's exact notes-per-beat and differs only in pitch.
// Constraints (levels 3..10): exactly one winning config; all decoys same shape (no decoy ringing the same tiles on the
// same beats); >= 2 decoys match the tune's first 3 beats; >= 3 non-dial tiles besides the start share the first pitch;
// dials load at fixed random orientations, at least one wrong (some may already be right); the start tile has an incoming
// pointer at load OR >= 2 other non-dial tiles have none; the introduced mechanic is load-bearing (split/delay -> arrow:
// no win; mute -> arrow: a second start would also win).   usage: node tools/gen11.js <spec> <seconds>
const E=require('../engine.js');const N=6,NP=E.SCALE.length;
const A=['>','v','<','^'];const R1={'>':'v','v':'<','<':'^','^':'>'};const rotDir=(d,q)=>{for(let i=0;i<q;i++)d=R1[d];return d};
const rnd=a=>a[Math.floor(Math.random()*a.length)];const ri=v=>Array.isArray(v)?v[0]+Math.floor(Math.random()*(v[1]-v[0]+1)):v;
const SPECS={ // per quarter
 dial:{k:[2,3],S:0,M:0,D:0,R:1,chords:0,lb:'R',beats:[6,12]},
 split:{k:[2,3],S:[1,2],M:0,D:0,R:1,chords:1,lb:'S',beats:[5,10]},
 branch:{k:[3,4],S:[2,3],M:0,D:0,R:1,chords:2,lb:'',beats:[5,10]},
 hush:{k:[3,4],S:[1,2],M:1,D:0,R:1,chords:1,lb:'M',beats:[5,10]},
 delay:{k:[3,4],S:[1,2],M:0,D:1,R:1,chords:1,lb:'D',beats:[5,10]},
 chorus:{k:[4,4],S:[1,2],M:1,D:1,R:1,chords:1,lb:'D',beats:[5,10]},
 tuning:{k:[3,4],S:[1,2],M:0,D:0,R:1,chords:1,lb:'',beats:[5,10]},
 finale:{k:[4,5],S:[1,2],M:1,D:1,R:1,chords:1,lb:'D',beats:[5,10]},
};
const sp=SPECS[process.argv[2]],T=(+process.argv[3]||300)*1000;
const Q=[[0,0],[1,0],[2,0],[0,1],[1,1],[2,1],[0,2],[1,2],[2,2]];const rotXY=([x,y],q)=>{for(let i=0;i<q;i++)[x,y]=[N-1-y,x];return[x,y]};
const rotTok=(t,q)=>{if(t==='.')return t;if(t[0]==='S')return q%2?(t==='S-'?'S|':'S-'):t;return t.slice(0,-1)+rotDir(t[t.length-1],q)};
const cls=t=>t==='.'?'.':t[0]==='S'?'S':t.length===1?'A':t[0];
const rowsOf=(g,P)=>g.map((r,y)=>r.map((t,x)=>t==='.'?'.':t+':'+(P?P[y][x]:0)).join(' '));
const eqM=(a,b)=>a.length===b.length&&a.every((c,i)=>c.length===b[i].length&&c.every((v,j)=>v===b[i][j]));
const mel=(beats,P)=>beats.map(b=>b.map(([x,y])=>P[y][x]).sort((a,b)=>a-b));
function full(q){const g=Array.from({length:N},()=>Array(N).fill('.'));q.forEach((t,i)=>{if(t==='.')return;for(let r=0;r<4;r++){const [x,y]=rotXY(Q[i],r);g[y][x]=rotTok(t,r)}});return g}
function coverage(g){const out=[];let maxR=0;const base=E.parse({rows:rowsOf(g)});const pos=[];base.forEach((r,y)=>r.forEach((c,x)=>{if(c&&E.kind(c)==='rot')pos.push([x,y])}));
 for(let m=0;m<4**pos.length;m++){const g2=E.parse({rows:rowsOf(g)});let mm=m;const ks=pos.map(([x,y])=>{const k=mm%4;mm=Math.floor(mm/4);for(let i=0;i<k;i++)E.rotate(g2[y][x]);return k});
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(g2[y][x]&&E.kind(g2[y][x])!=='rot'){const r=E.simulate(g2,x,y);const ev=r.ev.filter(e=>!e.muted);if(ev.length>maxR)maxR=ev.length;if(r.solved){
   const beats=[];ev.forEach(e=>{(beats[e.beat]=beats[e.beat]||[]).push([e.x,e.y])});for(let i=0;i<beats.length;i++)beats[i]=beats[i]||[];
   out.push({x,y,ks,beats,sig:ev.map(e=>e.beat+':'+e.x+','+e.y).sort().join('|'),shape:beats.map(b=>b.length).join(',')})}}}
 return{out,pos,maxR}}
const want={S:ri(sp.S),M:ri(sp.M),D:ri(sp.D),R:ri(sp.R)};
function randQ(){const k=ri(sp.k);const q=Array(9).fill('.');const types=[];for(let i=0;i<want.R;i++)types.push('R'+rnd(A));for(let i=0;i<want.M;i++)types.push('M'+rnd(A));
 for(let i=0;i<want.D;i++)types.push('D'+rnd(A));for(let i=0;i<want.S;i++)types.push(rnd(['S-','S|']));while(types.length<k)types.push(rnd(A));
 [...Array(9).keys()].sort(()=>Math.random()-.5).slice(0,types.length).forEach((c,i)=>q[c]=types[i]);return q}
function mutQ(q){const h=q.slice();const on=[...h.keys()].filter(i=>h[i]!=='.'),off=[...h.keys()].filter(i=>h[i]==='.');const m=Math.random();
 if(m<.5){const i=rnd(on);const c=cls(h[i]);h[i]=c==='S'?(h[i]==='S-'?'S|':'S-'):c==='A'?rnd(A):c+rnd(A)}
 else if(m<.85&&off.length){const i=rnd(on),j=rnd(off);h[j]=h[i];h[i]='.'}
 else if(m<.93&&off.length&&on.length<sp.k[1]){h[rnd(off)]=rnd(A)}
 else{const pl=on.filter(i=>cls(h[i])==='A');if(pl.length&&on.length>sp.k[0])h[rnd(pl)]='.'}
 return h}
function evalQ(q){const g=full(q);const {out,maxR}=coverage(g);const n=g.flat().filter(t=>t!=='.').length;
 if(out.length<4)return{s:-100+30*maxR/n+5*out.length};
 const sh=new Set(out.map(c=>c.shape));const sigs=new Set(out.map(c=>c.sig));
 let s=-(sh.size-1)*10-(out.length-sigs.size)*10+Math.min(out.length,12);
 const c=out[0];if(c.beats.length<sp.beats[0]||c.beats.length>sp.beats[1])s-=5;if(c.beats.filter(b=>b.length>1).length<sp.chords)s-=5;
 const sh3=new Set(out.map(c=>c.shape.split(',').slice(0,3).join(',')));
 return{s,ok:sh.size===1&&sigs.size===out.length&&s>-1,out,g}}
function incoming(g,x,y){for(let yy=0;yy<N;yy++)for(let xx=0;xx<N;xx++){const t=g[yy][xx];if(t==='.'||(xx===x&&yy===y))continue;const c=E.parse({rows:rowsOf(g)})[yy][xx];if(E.targets(E.parse({rows:rowsOf(g)}),xx,yy).some(([a,b])=>a===x&&b===y))return true}return false}
function finish(g){const {out,pos}=coverage(g);
 for(let attempt=0;attempt<30;attempt++){const tg=rnd(out);
  // dial orientations at load: random, at least one wrong for the solution config
  const goal=pos.map(([x,y],i)=>rotDir(g[y][x][1],tg.ks[i]));const g0=g.map(r=>r.slice());let wrong=0;
  pos.forEach(([x,y],i)=>{const k=Math.floor(Math.random()*4);if(k)wrong++;g0[y][x]='R'+rotDir(goal[i],k)});if(!wrong)continue;
  const cov0=coverage(g0);const wantK=pos.map(([x,y],i)=>{let d=g0[y][x][1],k=0;while(d!==goal[i]){d=R1[d];k++}return k});
  const tg0=cov0.out.find(c=>c.x===tg.x&&c.y===tg.y&&c.ks.every((k,i)=>k===wantK[i]));if(!tg0)continue;
  // start not identifiable as the only tile nothing points at
  const noIn=[];g0.forEach((r,y)=>r.forEach((t,x)=>{if(t!=='.'&&t[0]!=='R'&&!incoming(g0,x,y))noIn.push([x,y])}));
  const startNoIn=noIn.some(([x,y])=>x===tg0.x&&y===tg0.y);if(startNoIn&&noIn.length<3)continue;
  let alt=null;if(sp.lb==='M'){const gM=g0.map(r=>r.slice());gM.forEach((r,y)=>r.forEach((t,x)=>{if(t[0]==='M')gM[y][x]=t[1]}));const sigs=new Set(cov0.out.map(d=>d.sig));alt=coverage(gM).out.filter(d=>!sigs.has(d.sig));if(!alt.length)return null}
  const cells=[];g0.forEach((r,y)=>r.forEach((t,x)=>{if(t!=='.')cells.push([x,y])}));const others=cov0.out.filter(d=>d!==tg0);
  for(let rs=0;rs<25;rs++){const P=g0.map(r=>r.map(()=>Math.floor(Math.random()*NP)));
   const cost=()=>{const Tm=mel(tg0.beats,P);let c=0;const ms=others.map(d=>mel(d.beats,P));c+=20*ms.filter(m=>eqM(m,Tm)).length;
    const m3=ms.filter(m=>eqM(m.slice(0,3),Tm.slice(0,3))).length;c+=8*Math.max(0,2-m3);const fp=P[tg0.y][tg0.x];let sh=0;cells.forEach(([x,y])=>{if(g0[y][x][0]!=='R'&&!(x===tg0.x&&y===tg0.y)&&P[y][x]===fp)sh++});c+=5*Math.max(0,3-sh);
    c+=5*Tm.filter(ch=>new Set(ch).size!==ch.length).length;if(alt&&!alt.some(d=>eqM(mel(d.beats,P),Tm)))c+=10;return{c,m3,sh,Tm}};
   let cur=cost();for(let it=0;it<5000&&cur.c>0;it++){const [x,y]=rnd(cells);const o=P[y][x];P[y][x]=Math.floor(Math.random()*NP);const nc=cost();if(nc.c<=cur.c||Math.random()<.02)cur=nc;else P[y][x]=o}
   if(cur.c)continue;
   // exact check + load-bearing
   const win=(gg)=>coverage(gg).out.filter(d=>eqM(mel(d.beats,P),cur.Tm)).length;if(win(g0)!==1)continue;let lb=true;
   if(sp.lb==='S'||sp.lb==='D'){g0.forEach((r,y)=>r.forEach((t,x)=>{if(!lb||cls(t)!==sp.lb)return;const alts=t[0]==='S'?(t==='S-'?['<','>']:['^','v']):[t[1]];for(const a of alts){const g2=g0.map(r=>r.slice());g2[y][x]=a;if(win(g2)>0)lb=false}}))}
   if(sp.lb==='M'){g0.forEach((r,y)=>r.forEach((t,x)=>{if(!lb||t[0]!=='M')return;const g2=g0.map(r=>r.slice());g2[y][x]=t[1];if(win(g2)<2)lb=false}))}
   if(!lb)continue;
   return{rows:rowsOf(g0,P),melody:cur.Tm,stats:{tiles:cells.length,decoys:others.length,sameShape:others.filter(d=>d.shape===tg0.shape).length,match3:cur.m3,sharedFirst:cur.sh,dials:pos.length,dialsWrong:wrong,startHasIncoming:!startNoIn,noIncoming:noIn.length,solution:[tg0.x+1,tg0.y+1,wantK]}}}}
 return null}
const t0=Date.now();let res=null;
while(!res&&Date.now()-t0<T){let q=randQ(),e=evalQ(q);let temp=2;const tEnd=Date.now()+40000;
 while(Date.now()<tEnd&&!res){const h=mutQ(q);const f=evalQ(h);if(f.s>=e.s||Math.random()<Math.exp((f.s-e.s)/temp)){q=h;e=f}temp=Math.max(.2,temp*.998);
  if(e.ok){res=finish(e.g);if(!res){q=randQ();e=evalQ(q)}}}}
console.log(res?JSON.stringify(res):'none');
