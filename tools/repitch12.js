// v2.12 repair: win = tune right (silent tiles allowed). Keeps the board layout and the intended (full-ring) solution chain,
// re-pitches as few tiles as possible so NO other dial setting x start (full-ring or not) plays the tune, while keeping
// check_levels rules (>=2 full-ring decoys match first 3 beats, >=3 non-dial tiles share the first pitch, no doubled chord pitch).
// usage: node tools/repitch12.js <levelIndex0> [seconds]   (writes final.json on success)
const E=require('../engine.js');const fs=require('fs');const L=require('../final.json');const {solve}=require('./solve.js');
E.LEVELS.splice(0,E.LEVELS.length,...L);
const li=+process.argv[2],T=(+process.argv[3]||60)*1000,lv=L[li];
const tok=lv.rows.map(r=>r.split(/\s+/).map(t=>t==='.'?'.':t.split(':')[0]));
const P0=lv.rows.map(r=>r.split(/\s+/).map(t=>t==='.'?0:+t.split(':')[1]));
const rowsOf=P=>tok.map((r,y)=>r.map((t,x)=>t==='.'?'.':t+':'+P[y][x]).join(' '));
// all configs, pitch-independent beats (coords of ringing tiles per beat)
const base=E.parse(lv),pos=[];base.forEach((r,y)=>r.forEach((c,x)=>{if(c&&E.kind(c)==='rot')pos.push([x,y])}));
const cfg=[];for(let m=0;m<4**pos.length;m++){const g=E.parse(lv);let mm=m;const ks=pos.map(([x,y])=>{const k=mm%4;mm=Math.floor(mm/4);for(let i=0;i<k;i++)E.rotate(g[y][x]);return k});
 for(let y=0;y<6;y++)for(let x=0;x<6;x++)if(g[y][x]&&E.kind(g[y][x])!=='rot'){const r=E.simulate(g,x,y);const b=[];r.ev.filter(e=>!e.muted).forEach(e=>(b[e.beat]=b[e.beat]||[]).push([e.x,e.y]));for(let i=0;i<b.length;i++)b[i]=b[i]||[];cfg.push({x,y,ks,b,full:r.solved})}}
const mel=(b,P)=>b.map(c=>c.map(([x,y])=>P[y][x]).sort((a,b)=>a-b));
const eqM=(a,b)=>a.length===b.length&&a.every((c,i)=>E.topOf(c)===E.topOf(b[i]));
const tg=cfg.find(c=>c.full&&eqM(mel(c.b,P0),lv.melody));if(!tg)throw 'no intended solution';
const sig=c=>JSON.stringify(c.b);const others=cfg.filter(c=>c!==tg&&sig(c)!==sig(tg));   // identical chains (dial that never rings) are the same setup
const cells=[];tok.forEach((r,y)=>r.forEach((t,x)=>{if(t!=='.')cells.push([x,y])}));
function cost(P){const Tm=mel(tg.b,P);let c=0,m3=0;for(const o of others){const m=mel(o.b,P);if(eqM(m,Tm))c+=30;if(o.full&&eqM(m.slice(0,3),Tm.slice(0,3)))m3++}
 c+=10*Math.max(0,2-m3);const fp=P[tg.y][tg.x];let sh=0;cells.forEach(([x,y])=>{if(tok[y][x][0]!=='R'&&!(x===tg.x&&y===tg.y)&&P[y][x]===fp)sh++});c+=6*Math.max(0,3-sh);
 c+=5*Tm.filter(ch=>new Set(ch).size!==ch.length).length;return c}
const diff=P=>cells.filter(([x,y])=>P[y][x]!==P0[y][x]).length;
let best=null;const t0=Date.now();
while(Date.now()-t0<T){const P=P0.map(r=>r.slice());let c=cost(P);
 for(let it=0;it<3000&&c>0;it++){const [x,y]=cells[Math.floor(Math.random()*cells.length)];const o=P[y][x];P[y][x]=Math.floor(Math.random()*6);const n=cost(P)+0.5*diff(P);if(n<=c+0.5*diff(P)+(P[y][x]===o?0:0)&&cost(P)<=c||Math.random()<.01)c=cost(P);else P[y][x]=o}
 if(c===0&&(!best||diff(P)<diff(best)))best=P.map(r=>r.slice())}
if(!best){console.log('no fix found');process.exit(1)}
lv.rows=rowsOf(best);lv.melody=mel(tg.b,best);fs.writeFileSync('final.json',JSON.stringify(L,null,2)+'\n');
console.log(`L${li+1}: re-pitched ${diff(best)} tile(s)`,JSON.stringify(lv.rows));
