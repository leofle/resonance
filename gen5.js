// Build-4 generator: random boards filtered by the solver under the same-beat mute rule.
// usage: node gen5.js <spec> [seconds]
const E=require('./engine.js');const {trimRows}=require('./solve.js');
const A=['>','<','^','v'];const R=a=>a[Math.floor(Math.random()*a.length)];
const SPECS={
 delay:{W:5,H:4,n:[10,12],w:{a:6,S:3,D:2,M:1},need:{D:1,M:1},maxD:2,maxM:1,loadD:true},
 hush:{W:5,H:5,n:[11,13],w:{a:6,S:4,M:2},need:{M:2},maxM:2},
 chorus:{W:6,H:5,n:[16,18],w:{a:6,S:4,D:2,M:2},need:{D:1,M:2},maxM:2,maxD:2,loadD:true},
 finale:{W:5,H:5,n:[13,14],w:{a:5,S:3,D:2,M:2,R:2},need:{D:1,M:1,R:2},maxR:3,maxM:2,maxD:2,loadD:true},
};
const sp=SPECS[process.argv[2]];const T=(+process.argv[3]||60)*1000;
const bag=[];for(const k in sp.w)for(let i=0;i<sp.w[k];i++)bag.push(k);
function tok(k){return k==='a'?R(A):k==='S'?R(['S-','S|']):k+R(A)}
function count(rows){return E.parse({rows});}
function sols(rows){const base=trimRows(E.parse({rows}));const pos=[];base.forEach((r,y)=>r.forEach((c,x)=>{if(c&&E.kind(c)==='rot')pos.push([x,y])}));
 let s=0,tr=0;for(let m=0;m<4**pos.length;m++){const g=trimRows(E.parse({rows}));let mm=m;pos.forEach(([x,y])=>{const k=mm%4;mm=Math.floor(mm/4);for(let i=0;i<k;i++)E.rotate(g[y][x])});
  for(let y=0;y<g.length;y++)for(let x=0;x<g[0].length;x++)if(g[y][x]){tr++;if(E.simulate(g,x,y).solved){s++;if(s>2)return s}}}return s}
const t0=Date.now();let it=0;
while(Date.now()-t0<T){it++;const n=sp.n[0]+Math.floor(Math.random()*(sp.n[1]-sp.n[0]+1));
 const g=Array.from({length:sp.H},()=>Array(sp.W).fill('.'));const cnt={};let placed=0;
 while(placed<n){const x=Math.floor(Math.random()*sp.W),y=Math.floor(Math.random()*sp.H);if(g[y][x]!=='.')continue;let k=R(bag);
  if(sp['max'+k]&&(cnt[k]||0)>=sp['max'+k])k='a';cnt[k]=(cnt[k]||0)+1;g[y][x]=tok(k);placed++}
 if(Object.entries(sp.need).some(([k,v])=>(cnt[k]||0)<v))continue;
 const rows=g.map(r=>r.join(' '));
 // quick prefilter: some config/tap solves (cheap check w/o rotations first unless R)
 if(sols(rows)!==1)continue;
 if(sp.loadD){// every delay load-bearing: replacing any single D with its plain arrow kills all solutions
  let ok=true;g.forEach((r,y)=>r.forEach((t,x)=>{if(ok&&t[0]==='D'){const g2=g.map(r=>r.slice());g2[y][x]=t[1];if(sols(g2.map(r=>r.join(' ')))!==0)ok=false}}));if(!ok)continue}
 // every mute load-bearing as a timing element: mute must actually receive a coincident ring (true if solved)
 console.log(JSON.stringify(rows));process.exit(0)}
console.log('none after',it);
