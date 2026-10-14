// v2.7 generator. Every level 3..10 has dials; the win needs the right start AND dials turned (all dials scrambled at load).
// Stage 1 (structure, pitch-free): local search for a board with the spec's tile kinds where >= minDec wrong full-ring configs
//   exist, no decoy rings the same tiles on the same beats as the solution, >= 2 decoys share the solution's notes-per-beat
//   for the first 3 beats, maximising decoys with the full notes-per-beat shape.
// Stage 2 (pitches 0..5, hill climb): exactly one config plays the tune; >= 2 decoys match the tune's first 3 beats;
//   >= 3 non-dial tiles besides the start share the first pitch; no doubled pitch in a chord.
// Stage 3: the mechanic the level introduces is load-bearing (split/mute/delay -> plain arrow leaves no winning config).
// usage: node tools/gen10.js <spec> <seconds>   -> level JSON
const E=require('../engine.js');const N=6,NP=E.SCALE.length;
const A=['>','v','<','^'];const R1={'>':'v','v':'<','<':'^','^':'>'};const rotDir=(d,q)=>{for(let i=0;i<q;i++)d=R1[d];return d};
const SPECS={
 dial:{n:[8,10],S:0,M:0,D:0,R:1,minDec:3,chords:0,lb:[]},
 split:{n:[9,11],S:[2,4],M:0,D:0,R:1,minDec:3,chords:1,lb:['S']},
 branch:{n:[11,13],S:[3,6],M:0,D:0,R:[1,2],minDec:4,chords:2,lb:[]},
 hush:{n:[11,13],S:[2,5],M:1,D:0,R:1,minDec:3,chords:1,lb:['M']},
 delay:{n:[11,13],S:[1,4],M:[0,1],D:1,R:1,minDec:3,chords:1,lb:['D']},
 chorus:{n:[12,15],S:[2,5],M:1,D:1,R:1,minDec:3,chords:1,lb:['D']},
 tuning:{n:[12,15],S:[2,5],M:[0,1],D:0,R:3,minDec:3,chords:1,lb:[]},
 finale:{n:[13,16],S:[2,5],M:1,D:1,R:2,minDec:3,chords:1,lb:['D']},
};
const sp=SPECS[process.argv[2]],T=(+process.argv[3]||240)*1000;
const ri=v=>Array.isArray(v)?v[0]+Math.floor(Math.random()*(v[1]-v[0]+1)):v;const rnd=a=>a[Math.floor(Math.random()*a.length)];
const cls=t=>t==='.'?'.':t[0]==='S'?'S':t.length===1?'A':t[0];
const shp=m=>m.map(c=>c.length).join(',');
const rowsOf=(g,P)=>g.map((r,y)=>r.map((t,x)=>t==='.'?'.':t+':'+(P?P[y][x]:0)).join(' '));
// all configs (dial settings x non-dial starts) that ring every tile; events are pitch-independent
function coverage(g){const out=[];let maxR=0;const base=E.parse({rows:rowsOf(g)});const pos=[];base.forEach((r,y)=>r.forEach((c,x)=>{if(c&&E.kind(c)==='rot')pos.push([x,y])}));
 for(let m=0;m<4**pos.length;m++){const g2=E.parse({rows:rowsOf(g)});let mm=m;const ks=pos.map(([x,y])=>{const k=mm%4;mm=Math.floor(mm/4);for(let i=0;i<k;i++)E.rotate(g2[y][x]);return k});
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(g2[y][x]&&E.kind(g2[y][x])!=='rot'){const r=E.simulate(g2,x,y);const nr=r.ev.filter(e=>!e.muted).length;if(nr>maxR)maxR=nr;if(r.solved){const ev=r.ev.filter(e=>!e.muted);
   const beats=[];ev.forEach(e=>{(beats[e.beat]=beats[e.beat]||[]).push([e.x,e.y])});for(let i=0;i<beats.length;i++)beats[i]=beats[i]||[];
   out.push({x,y,ks,beats,sig:ev.map(e=>e.beat+':'+e.x+','+e.y).sort().join(' '),shape:beats.map(b=>b.length).join(',')})}}}
 return{out,pos,maxR}}
function counts(g){const c={S:0,M:0,D:0,R:0,A:0,n:0};g.flat().forEach(t=>{if(t==='.')return;c.n++;c[cls(t)]++});return c}
const want={S:ri(sp.S),M:ri(sp.M),D:ri(sp.D),R:ri(sp.R)};
function okCounts(g){const c=counts(g);return c.n>=sp.n[0]&&c.n<=sp.n[1]&&c.M===want.M&&c.D===want.D&&c.R===want.R&&c.S>=(Array.isArray(sp.S)?sp.S[0]:sp.S)&&c.S<=(Array.isArray(sp.S)?sp.S[1]:sp.S)}
function evalS(g){const {out,maxR}=coverage(g);if(out.length-1<sp.minDec)return{s:-100+8*out.length+20*maxR/counts(g).n};let best=null;
 for(const c of out){if(c.beats.length<6||c.beats.length>9)continue;if(c.beats.filter(b=>b.length>1).length<sp.chords)continue;if(out.some(d=>d!==c&&d.sig===c.sig))continue;
  const sh3=c.shape.split(',').slice(0,3).join(',');const d3=out.filter(d=>d!==c&&d.shape.split(',').slice(0,3).join(',')===sh3).length;if(d3<2)continue;
  const same=out.filter(d=>d!==c&&d.shape===c.shape).length,dec=out.length-1;const s=same-1.5*(dec-same)+2*Math.min(d3,4)-Math.max(0,dec-12);
  if(!best||s>best.s)best={s,tg:c,same,dec,d3,out}}
 return best||{s:-50}}
function randomBoard(){const g=Array.from({length:N},()=>Array(N).fill('.'));const n=ri(sp.n);const types=[];
 for(let i=0;i<want.D;i++)types.push('D'+rnd(A));for(let i=0;i<want.M;i++)types.push('M'+rnd(A));for(let i=0;i<want.R;i++)types.push('R'+rnd(A));for(let i=0;i<want.S;i++)types.push(rnd(['S-','S|']));
 while(types.length<n)types.push(rnd(A));const cells=[...Array(36).keys()].sort(()=>Math.random()-.5).slice(0,n);cells.forEach((k,i)=>{g[Math.floor(k/6)][k%6]=types[i]});return g}
function mutate(g){const h=g.map(r=>r.slice());const cells=[],empt=[];h.forEach((r,y)=>r.forEach((t,x)=>(t==='.'?empt:cells).push([x,y])));const m=Math.random();
 if(m<.4){const [x,y]=rnd(cells);const t=h[y][x],c=cls(t);if(c==='S')h[y][x]=t==='S-'?'S|':'S-';else if(c==='A')h[y][x]=rnd(A);else h[y][x]=c+rnd(A)}
 else if(m<.75){const [x,y]=rnd(cells);const [a,b]=rnd(empt);h[b][a]=h[y][x];h[y][x]='.'}
 else if(m<.85){const [a,b]=rnd(empt);h[b][a]=Math.random()<.3?rnd(['S-','S|']):rnd(A)}
 else if(m<.93){const pl=cells.filter(([x,y])=>'AS'.includes(cls(h[y][x])));if(pl.length){const [x,y]=rnd(pl);h[y][x]='.'}}
 else{const pl=cells.filter(([x,y])=>'AS'.includes(cls(h[y][x])));if(pl.length){const [x,y]=rnd(pl);h[y][x]=cls(h[y][x])==='S'?rnd(A):rnd(['S-','S|'])}}
 return okCounts(h)?h:null}
// stage 2: pitches
function melodyOf(beats,P){return beats.map(b=>b.map(([x,y])=>P[y][x]).sort((a,b)=>a-b))}
const eqM=(a,b)=>a.length===b.length&&a.every((c,i)=>c.length===b[i].length&&c.every((v,j)=>v===b[i][j]));
function pcost(st,P,g){const {tg,out}=st;const T=melodyOf(tg.beats,P);let c=0;
 const others=out.filter(d=>d!==tg);const ms=others.map(d=>melodyOf(d.beats,P));
 c+=20*ms.filter(m=>eqM(m,T)).length;
 const m3=ms.filter(m=>m.length>=3&&eqM(m.slice(0,3),T.slice(0,3))).length;c+=8*Math.max(0,2-m3);
 const fp=P[tg.y][tg.x];let sh=0;g.forEach((r,y)=>r.forEach((t,x)=>{if(t!=='.'&&t[0]!=='R'&&!(x===tg.x&&y===tg.y)&&P[y][x]===fp)sh++}));c+=5*Math.max(0,3-sh);
 c+=5*T.filter(ch=>new Set(ch).size!==ch.length).length;
 if(st.alt&&!st.alt.some(d=>eqM(melodyOf(d.beats,P),T)))c+=10;   // mute load-bearing: without it some other start would also win
 return{c,m3,sh,T}}
function pitchSearch(st,g){for(let rs=0;rs<30;rs++){const P=g.map(r=>r.map(()=>Math.floor(Math.random()*NP)));let cur=pcost(st,P,g);
  const cells=[];g.forEach((r,y)=>r.forEach((t,x)=>{if(t!=='.')cells.push([x,y])}));
  for(let it=0;it<4000&&cur.c>0;it++){const [x,y]=rnd(cells);const old=P[y][x];P[y][x]=Math.floor(Math.random()*NP);const nc=pcost(st,P,g);if(nc.c<=cur.c||Math.random()<.02)cur=nc;else P[y][x]=old}
  if(cur.c===0)return{P,...cur}}return null}
// winning configs on the real (pitched) board
function wins(g,P,mel){const {out}=coverage(g);return out.filter(c=>eqM(melodyOf(c.beats,P),mel)).length}
function loadBearing(g,P,mel){for(let y=0;y<N;y++)for(let x=0;x<N;x++){const t=g[y][x];if(t==='.')continue;const c=cls(t);if(!sp.lb.includes(c))continue;
  const alts=c==='S'?(t==='S-'?['<','>']:['^','v']):[t[1]];for(const a of alts){const g2=g.map(r=>r.slice());g2[y][x]=a;const w=wins(g2,P,mel);if(c==='M'?w<2:w>0)return false}}return true}
const t0=Date.now();let best=null;const DBG={tg:0,scr:0,pitch:0,win:0,lb:0,bestS:-1e9};if(process.env.DBG)setInterval(()=>console.error(JSON.stringify(DBG)),15000).unref();
outer:while(Date.now()-t0<T){let cur=randomBoard();let ce=evalS(cur);const tEnd=Math.min(T,Date.now()-t0+60000)+t0;let temp=1.5;
 while(Date.now()<tEnd){const h=mutate(cur);if(!h)continue;const e=evalS(h);if(e.s>=ce.s||Math.random()<Math.exp((e.s-ce.s)/temp)){cur=h;ce=e}
  temp=Math.max(.2,temp*.999);
  if(ce.s>DBG.bestS)DBG.bestS=ce.s;
  if(ce.tg&&(!best||ce.s>best.st.s)){DBG.tg++;// try to finish this structure
   const st=ce,g=cur.map(r=>r.slice());const pos=[];g.forEach((r,y)=>r.forEach((t,x)=>{if(t[0]==='R')pos.push([x,y])}));
   // scramble dials: initial = solved orientation rotated back by 1..3
   const g0=g.map(r=>r.slice());const goal=pos.map(([x,y],i)=>rotDir(g[y][x][1],st.tg.ks[i]));pos.forEach(([x,y],i)=>{g0[y][x]='R'+rotDir(goal[i],4-(1+Math.floor(Math.random()*3)))});
   const cov0=coverage(g0);const wantK=pos.map(([x,y],i)=>{let d=g0[y][x][1],k=0;while(d!==goal[i]){d=R1[d];k++}return k});
   const tg0=cov0.out.find(c=>c.x===st.tg.x&&c.y===st.tg.y&&c.ks.every((k,i)=>k===wantK[i]));if(!tg0){DBG.scr++;continue}
   const st0={tg:tg0,out:cov0.out};if(sp.lb.includes('M')){const g2=g0.map(r=>r.slice());g2.forEach((r,y)=>r.forEach((t,x)=>{if(t[0]==='M')g2[y][x]=t[1]}));const sigs=new Set(cov0.out.map(d=>d.sig));st0.alt=coverage(g2).out.filter(d=>!sigs.has(d.sig));/* chains that exist only without the mute */if(!st0.alt.length)continue}const ps=pitchSearch(st0,g0);if(!ps){DBG.pitch++;continue}
   if(wins(g0,ps.P,ps.T)!==1){DBG.win++;continue}if(!loadBearing(g0,ps.P,ps.T)){DBG.lb++;continue}
   best={st:ce,level:{rows:rowsOf(g0,ps.P),melody:ps.T},stats:{tiles:counts(g0).n,decoys:cov0.out.length-1,sameShape:cov0.out.filter(d=>d!==tg0&&d.shape===tg0.shape).length,match3:ps.m3,sharedFirst:ps.sh,dials:pos.length,solution:[tg0.x+1,tg0.y+1,wantK]}};
   console.error(JSON.stringify(best.stats))}}}
if(process.env.DBG)console.error(JSON.stringify(DBG));console.log(best?JSON.stringify({...best.level,stats:best.stats}):'none');
