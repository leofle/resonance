const E=require('./engine.js');
function solutions(rows){const lv={rows};const g=E.parse(lv);let k=0;g.forEach(r=>r.forEach(c=>{if(c&&E.kind(c)==='rot')k++}));
 const sols=[];for(let m=0;m<Math.pow(4,k);m++){const gg=E.parse(lv);let mm=m;gg.forEach(r=>r.forEach(c=>{if(c&&E.kind(c)==='rot'){for(let i=0;i<mm%4;i++)E.rotate(c);mm=Math.floor(mm/4)}}));
  gg.forEach((r,y)=>r.forEach((c,x)=>{if(c&&E.simulate(gg,x,y).solved)sols.push({m,x,y})}));}return{sols,k};}
const A=['>','<','^','v'];
function rnd(a){return a[Math.floor(Math.random()*a.length)]}
const specs=[
 {W:5,H:3,n:8,pool:{'':1}},
 {W:5,H:4,n:10,pool:{'':1}},
 {W:5,H:5,n:9,pool:{'':5,S:1},need:'S'},
 {W:5,H:5,n:12,pool:{'':4,S:1},need:'S'},
 {W:5,H:5,n:11,pool:{'':4,S:1,D:1},need:'D'},
 {W:5,H:5,n:11,pool:{'':4,S:1,M:1},need:'M'},
 {W:5,H:5,n:12,pool:{'':4,S:2,M:1,D:1},need:'M'},
 {W:5,H:5,n:9,pool:{'':5,S:1,R:1},need:'R'},
 {W:6,H:5,n:12,pool:{'':4,S:1,R:1,M:1},need:'R'},
 {W:6,H:5,n:14,pool:{'':6,S:2,R:1,M:1,D:1},need:'R'},
];
function sample(s){const types=[];for(const k in s.pool)for(let i=0;i<s.pool[k];i++)types.push(k);
 const g=Array.from({length:s.H},()=>Array(s.W).fill('.'));let placed=0;
 while(placed<s.n){const x=Math.floor(Math.random()*s.W),y=Math.floor(Math.random()*s.H);if(g[y][x]!=='.')continue;
  const t=rnd(types);g[y][x]=t==='S'?rnd(['S-','S|']):t+rnd(A);placed++;}
 return g.map(r=>r.join(' '));}
const out=[];
const ONLY=+process.argv[2];specs.forEach((s,i)=>{if(i!==ONLY)return;let best=null;for(let it=0;it<400000;it++){const rows=sample(s);const flat=rows.join(' ');
  if(s.need&&!flat.split(' ').some(t=>t[0]===s.need))continue;
  {const r=(flat.match(/R/g)||[]).length;if(s.need==='R'&&(r<2||r>3))continue;}
  const {sols}=solutions(rows);if(sols.length===0)continue;
  if(s.need==='R'&&sols.some(q=>q.m===0))continue; // must rotate
  if(sols.length<=2){best=rows;break;}}
 console.error(i+1,best?'ok':'FAIL');out.push(best);});
console.log(JSON.stringify(out,null,1));
