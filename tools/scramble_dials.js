// Re-scramble dial orientations on a level to random-looking fixed offsets (at least one wrong).
// Keeps uniqueness, melody, and load-bearing. usage: node tools/scramble_dials.js [levelIndex]
const E=require('../engine.js');const L=require('../final.json');
const A=['>','v','<','^'];const R1={'>':'v','v':'<','<':'^','^':'>'};
const rotDir=(d,q)=>{for(let i=0;i<q;i++)d=R1[d];return d};
const eqM=(a,b)=>a.length===b.length&&a.every((c,i)=>c.length===b[i].length&&c.every((v,j)=>v===b[i][j]));
function audit(level){const g0=E.parse(level);const pos=[];g0.forEach((r,y)=>r.forEach((c,x)=>{if(c&&E.kind(c)==='rot')pos.push([x,y])}));
 const wins=[];for(let m=0;m<4**pos.length;m++){const g=E.parse(level);let mm=m;const ks=pos.map(([x,y])=>{const k=mm%4;mm=Math.floor(mm/4);for(let i=0;i<k;i++)E.rotate(g[y][x]);return k});
  for(let y=0;y<6;y++)for(let x=0;x<6;x++)if(g[y][x]&&E.kind(g[y][x])!=='rot'){const r=E.simulate(g,x,y);if(r.solved&&eqM(r.melody,level.melody))wins.push({x,y,ks})}}
 return{pos,wins}}
function scramble(level){const {pos,wins}=audit(level);if(wins.length!==1)return null;const w=wins[0];
 // current dial dirs at load; solution dirs = rotate load by w.ks
 const load=pos.map(([x,y])=>E.parse(level)[y][x].t[1]);const goal=pos.map((_,i)=>rotDir(load[i],w.ks[i]));
 for(let try_=0;try_<2000;try_++){const ks=pos.map(()=>Math.floor(Math.random()*4));if(pos.length&&ks.filter(k=>k).length<Math.min(pos.length,+(process.env.MINWRONG||1)))continue; // at least one wrong
  const rows=level.rows.map((row,y)=>row.split(/\s+/).map((tok,x)=>{if(tok==='.')return'.';const[body,p]=tok.split(':');if(body[0]!=='R')return tok;
   const i=pos.findIndex(([a,b])=>a===x&&b===y);return'R'+rotDir(goal[i],ks[i])+':'+p}).join(' '));
  const cand={...level,rows};const a=audit(cand);if(a.wins.length!==1)continue;
  {const g0=E.parse(cand);const hasIn=(x,y)=>{for(let yy=0;yy<6;yy++)for(let xx=0;xx<6;xx++)if(g0[yy][xx]&&!(xx===x&&yy===y)&&E.targets(g0,xx,yy).some(([p,q])=>p===x&&q===y))return true;return false};
   let noIn=0;g0.forEach((r,y)=>r.forEach((c,x)=>{if(c&&E.kind(c)!=='rot'&&!hasIn(x,y))noIn++}));const w0=a.wins[0];
   if(!hasIn(w0.x,w0.y)&&noIn<3)continue}  // start must not be the lone tile nothing points at
  // verify solution still needs the dial turns
  const wrong=ks.filter(k=>k).length;return{level:cand,wrong,sol:[a.wins[0].x+1,a.wins[0].y+1,a.wins[0].ks]}}
 return null}
const idx=process.argv[2]==null?null:+process.argv[2];
const out=L.map((lv,i)=>{if(idx!=null&&i!==idx)return lv;const r=scramble(lv);if(!r){console.error('fail',i+1);return lv}console.error('L'+(i+1),'wrong',r.wrong,'sol',r.sol);return r.level});
if(require.main===module){require('fs').writeFileSync('final.json',JSON.stringify(out,null,2)+'\n');console.log('wrote')}
module.exports={scramble,audit};
