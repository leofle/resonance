// 180°-symmetric boards (r2): every full-ring start shares one notes-per-beat shape.
// Random dial scramble (at least one wrong), start has incoming OR >=2 other no-incoming tiles.
// usage: node tools/gen12.js <spec> <seconds>
const E=require('../engine.js');const N=6,NP=E.SCALE.length;
const A=['>','v','<','^'];const R1={'>':'v','v':'<','<':'^','^':'>'};
const rotDir=(d,q)=>{for(let i=0;i<q;i++)d=R1[d];return d};const rnd=a=>a[Math.floor(Math.random()*a.length)];
const ri=v=>Array.isArray(v)?v[0]+Math.floor(Math.random()*(v[1]-v[0]+1)):v;
const SPECS={
 split:{tiles:[9,12],S:[1,1],M:0,D:0,R:[1,1],chords:1,lb:'S',beats:[5,10],minDec:3},
 hush:{tiles:[11,14],S:[0,1],M:1,D:0,R:[1,1],chords:1,lb:'M',beats:[5,10],minDec:3},
 delay:{tiles:[11,14],S:[0,1],M:0,D:1,R:[1,1],chords:1,lb:'D',beats:[5,10],minDec:3},
 chorus:{tiles:[13,16],S:[1,2],M:1,D:1,R:[1,2],chords:1,lb:'D',beats:[6,12],minDec:3},
 branch:{tiles:[11,14],S:[2,3],M:0,D:0,R:[1,2],chords:2,lb:'',beats:[5,10],minDec:3},
 finale:{tiles:[14,18],S:[1,2],M:1,D:1,R:[2,2],chords:1,lb:'D',beats:[6,12],minDec:3},
 tuning:{tiles:[12,16],S:[1,2],M:0,D:0,R:[2,3],chords:1,lb:'',beats:[5,10],minDec:3},
 dial:{tiles:[8,11],S:0,M:0,D:0,R:1,chords:0,lb:'R',beats:[5,10],minDec:3},
};
const sp=SPECS[process.argv[2]],T=(+process.argv[3]||300)*1000;
const half=[];for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(y*N+x<(N*N)/2)half.push([x,y]);
const rotXY=([x,y])=>[N-1-x,N-1-y];
const rotTok=t=>{if(t==='.')return'.';if(t[0]==='S')return t;return t.slice(0,-1)+rotDir(t[t.length-1],2)};
const cls=t=>t==='.'?'.':t[0]==='S'?'S':t.length===1?'A':t[0];
const rowsOf=(g,P)=>g.map((r,y)=>r.map((t,x)=>t==='.'?'.':t+':'+(P?P[y][x]:0)).join(' '));
const eqM=(a,b)=>a.length===b.length&&a.every((c,i)=>c.length===b[i].length&&c.every((v,j)=>v===b[i][j]));
const mel=(beats,P)=>beats.map(b=>b.map(([x,y])=>P[y][x]).sort((a,b)=>a-b));
function full(h){const g=Array.from({length:N},()=>Array(N).fill('.'));
 half.forEach(([x,y],i)=>{const t=h[i];if(t==='.')return;g[y][x]=t;const[x2,y2]=rotXY([x,y]);g[y2][x2]=rotTok(t)});return g}
function coverage(g){const out=[];const base=E.parse({rows:rowsOf(g)});const pos=[];base.forEach((r,y)=>r.forEach((c,x)=>{if(c&&E.kind(c)==='rot')pos.push([x,y])}));
 for(let m=0;m<4**pos.length;m++){const g2=E.parse({rows:rowsOf(g)});let mm=m;const ks=pos.map(([x,y])=>{const k=mm%4;mm=Math.floor(mm/4);for(let i=0;i<k;i++)E.rotate(g2[y][x]);return k});
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(g2[y][x]&&E.kind(g2[y][x])!=='rot'){const r=E.simulate(g2,x,y);const ev=r.ev.filter(e=>!e.muted);if(r.solved){
   const beats=[];ev.forEach(e=>{(beats[e.beat]=beats[e.beat]||[]).push([e.x,e.y])});for(let i=0;i<beats.length;i++)beats[i]=beats[i]||[];
   out.push({x,y,ks,beats,sig:ev.map(e=>e.beat+':'+e.x+','+e.y).sort().join('|'),shape:beats.map(b=>b.length).join(',')})}}}
 return{out,pos}}
function randH(){const want={S:ri(sp.S),M:ri(sp.M),D:ri(sp.D),R:ri(sp.R)};
 const types=[];for(let i=0;i<want.R;i++)types.push('R'+rnd(A));for(let i=0;i<want.M;i++)types.push('M'+rnd(A));
 for(let i=0;i<want.D;i++)types.push('D'+rnd(A));for(let i=0;i<want.S;i++)types.push(rnd(['S-','S|']));
 const k=Math.max(types.length,Math.ceil(ri(sp.tiles)/2));while(types.length<k)types.push(rnd(A));
 const h=Array(half.length).fill('.');[...Array(half.length).keys()].sort(()=>Math.random()-.5).slice(0,types.length).forEach((c,i)=>h[c]=types[i]);return h}
function mutH(h){const o=h.slice();const on=[...o.keys()].filter(i=>o[i]!=='.'),off=[...o.keys()].filter(i=>o[i]==='.');const m=Math.random();
 if(m<.45){const i=rnd(on);const c=cls(o[i]);o[i]=c==='S'?(o[i]==='S-'?'S|':'S-'):c==='A'?rnd(A):c+rnd(A)}
 else if(m<.8&&off.length){const i=rnd(on),j=rnd(off);o[j]=o[i];o[i]='.'}
 else if(m<.9&&off.length)o[rnd(off)]=rnd(A);
 else{const pl=on.filter(i=>cls(o[i])==='A');if(pl.length)o[rnd(pl)]='.'}
 return o}
function hasIn(g,x,y){const G=E.parse({rows:rowsOf(g)});for(let yy=0;yy<N;yy++)for(let xx=0;xx<N;xx++)if(G[yy][xx]&&!(xx===x&&yy===y)&&E.targets(G,xx,yy).some(([a,b])=>a===x&&b===y))return true;return false}
function finish(g){const {out,pos}=coverage(g);if(!out.length)return null;
 const shapes=new Set(out.map(c=>c.shape));if(shapes.size!==1)return null;
 const sigs=new Set(out.map(c=>c.sig));if(sigs.size!==out.length)return null;
 if(out.length-1<sp.minDec)return null;
 for(let attempt=0;attempt<40;attempt++){const tg=rnd(out);
  // random dial orientations at load; at least one wrong vs solution
  const goal=pos.map(([x,y],i)=>rotDir(g[y][x][1],tg.ks[i]));const g0=g.map(r=>r.slice());
  let wrong=0;pos.forEach(([x,y])=>{const k=Math.floor(Math.random()*4);if(k)wrong++;g0[y][x]='R'+rotDir(goal[pos.findIndex(p=>p[0]===x&&p[1]===y)],k)});
  if(!wrong&&pos.length)continue;
  const wantK=pos.map(([x,y],i)=>{let d=g0[y][x][1],k=0;while(d!==goal[i]&&k<4){d=R1[d];k++}return k});
  const cov0=coverage(g0);const tg0=cov0.out.find(c=>c.x===tg.x&&c.y===tg.y&&c.ks.every((k,i)=>k===wantK[i]));if(!tg0)continue;
  const noIn=[];g0.forEach((r,y)=>r.forEach((t,x)=>{if(t!=='.'&&t[0]!=='R'&&!hasIn(g0,x,y))noIn.push([x,y])}));
  const startNo=noIn.some(([x,y])=>x===tg0.x&&y===tg0.y);if(startNo&&noIn.length<3)continue;
  let alt=null;if(sp.lb==='M'){const gM=g0.map(r=>r.slice());gM.forEach((r,y)=>r.forEach((t,x)=>{if(t[0]==='M')gM[y][x]=t[1]}));const sigs0=new Set(cov0.out.map(d=>d.sig));alt=coverage(gM).out.filter(d=>!sigs0.has(d.sig));if(!alt.length)continue}
  const cells=[];g0.forEach((r,y)=>r.forEach((t,x)=>{if(t!=='.')cells.push([x,y])}));
  const others=cov0.out.filter(d=>!(d.x===tg0.x&&d.y===tg0.y&&d.ks.every((k,i)=>k===tg0.ks[i])));
  for(let rs=0;rs<30;rs++){const P=g0.map(r=>r.map(()=>Math.floor(Math.random()*NP)));
   const cost=()=>{const Tm=mel(tg0.beats,P);let c=0;const ms=others.map(d=>mel(d.beats,P));
    c+=25*ms.filter(m=>eqM(m,Tm)).length;const m3=ms.filter(m=>eqM(m.slice(0,3),Tm.slice(0,3))).length;c+=10*Math.max(0,2-m3);
    const fp=P[tg0.y][tg0.x];let sh=0;cells.forEach(([x,y])=>{if(g0[y][x][0]!=='R'&&!(x===tg0.x&&y===tg0.y)&&P[y][x]===fp)sh++});c+=6*Math.max(0,3-sh);
    c+=5*Tm.filter(ch=>new Set(ch).size!==ch.length).length;
    if(alt&&!alt.some(d=>eqM(mel(d.beats,P),Tm)))c+=12;return{c,m3,sh,Tm}};
   let cur=cost();for(let it=0;it<6000&&cur.c>0;it++){const[x,y]=rnd(cells);const o=P[y][x];P[y][x]=Math.floor(Math.random()*NP);const nc=cost();if(nc.c<=cur.c||Math.random()<.015)cur=nc;else P[y][x]=o}
   if(cur.c)continue;
   const win=gg=>coverage(gg).out.filter(d=>eqM(mel(d.beats,P),cur.Tm)).length;if(win(g0)!==1)continue;
   let lb=true;
   if(sp.lb==='S'||sp.lb==='D'){g0.forEach((r,y)=>r.forEach((t,x)=>{if(!lb||cls(t)!==sp.lb)return;const alts=t[0]==='S'?(t==='S-'?['>','<']:['^','v']):[t[1]];for(const a of alts){const g2=g0.map(rr=>rr.slice());g2[y][x]=a;if(win(g2)>0)lb=false}}))}
   if(sp.lb==='M'){g0.forEach((r,y)=>r.forEach((t,x)=>{if(!lb||t[0]!=='M')return;const g2=g0.map(rr=>rr.slice());g2[y][x]=t[1];if(win(g2)<2)lb=false}))}
   if(!lb)continue;
   return{rows:rowsOf(g0,P),melody:cur.Tm,stats:{tiles:cells.length,decoys:others.length,sameShape:others.filter(d=>d.shape===tg0.shape).length,match3:cur.m3,sharedFirst:cur.sh,dials:pos.length,dialsWrong:wrong,startHasIncoming:!startNo,noIncoming:noIn.length,solution:[tg0.x+1,tg0.y+1,wantK]}}}}
 return null}
const t0=Date.now();let res=null,best=-1e9;
while(!res&&Date.now()-t0<T){let h=randH(),g=full(h);let {out}=coverage(g);let sh=new Set(out.map(c=>c.shape)).size,sig=new Set(out.map(c=>c.sig)).size;
 let score=(sh===1?20:0)+(sig===out.length?10:0)+Math.min(out.length,12)-(sh-1)*5;if(score>best)best=score;
 if(sh===1&&sig===out.length&&out.length>=sp.minDec+1){res=finish(g);if(res)break}
 for(let i=0;i<80&&!res;i++){const h2=mutH(h);const g2=full(h2);const c=coverage(g2);const sh2=new Set(c.out.map(o=>o.shape)).size,sig2=new Set(c.out.map(o=>o.sig)).size;
  const sc=(sh2===1?20:0)+(sig2===c.out.length?10:0)+Math.min(c.out.length,12)-(sh2-1)*5;
  if(sc>=score||Math.random()<.05){h=h2;g=g2;out=c.out;score=sc;sh=sh2;sig=sig2}
  if(sh===1&&sig===out.length&&out.length>=sp.minDec+1){res=finish(g);if(res)break}}}
console.log(res?JSON.stringify(res):'none');
