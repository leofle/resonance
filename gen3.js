const E=require('./engine.js');const D={'>':[1,0],'<':[-1,0],'^':[0,-1],'v':[0,1]};const A=Object.keys(D);
const R=a=>a[Math.floor(Math.random()*a.length)];
function tok(types){const t=R(types);if(t==='')return R(A);return t==='S'?R(['S-','S|']):t+R(A)}
function dirs(t){return t==='S-'?['<','>']:t==='S|'?['^','v']:[t[t.length-1]]}
function build(W,H,n,types){const g=Array.from({length:H},()=>Array(W).fill('.'));
 const x0=Math.floor(Math.random()*W),y0=Math.floor(Math.random()*H);g[y0][x0]=tok(types.filter(t=>t!=='M'));
 let fr=dirs(g[y0][x0]).map(d=>[x0,y0,d]),c=1,guard=0;
 while(c<n&&guard++<500){if(!fr.length){// add stray tile anywhere
   break}
  const i=Math.floor(Math.random()*fr.length);const [x,y,d]=fr.splice(i,1)[0];const [dx,dy]=D[d];const opts=[];
  let a=x+dx,b=y+dy;while(a>=0&&b>=0&&a<W&&b<H&&g[b][a]==='.'){opts.push([a,b]);a+=dx;b+=dy}
  if(!opts.length)continue;const [px,py]=R(opts);const t=tok(types);g[py][px]=t;c++;dirs(t).forEach(dd=>fr.push([px,py,dd]))}
 return g.map(r=>r.join(' '))}
function sols(rows){const g=E.parse({rows});const s=[];g.forEach((r,y)=>r.forEach((c,x)=>{if(c&&E.simulate(g,x,y).solved)s.push([x,y])}));return{s,t:g.flat().filter(Boolean).length}}
const specs=[[6,6,21,['','','','','S'],'S'],[6,6,22,['','','','S'],'S'],[6,6,21,['','','','S','D'],'D'],[6,6,21,['','','','S','M'],'M'],[6,6,22,['','','S','S','M','D'],'M']];
const [W,H,n,ty,need]=specs[+process.argv[2]];const types=ty.map(t=>t===''?'':t);
for(let it=0;it<2e6;it++){const rows=build(W,H,n,types);const f=rows.join(' ').split(' ');
 if(f.filter(t=>t!=='.').length<n)continue;if(!f.some(t=>t[0]===need))continue;
 if(need==='M'&&f.filter(t=>t[0]==='M').length<1)continue;
 const {s,t}=sols(rows);if(s.length===1&&s.length/t<0.05){console.log(JSON.stringify([rows]));process.exit(0)}}
console.log('[null]');
