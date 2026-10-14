const E=require('./engine.js');
const src=require('fs').readFileSync('gen3.js','utf8').split('const specs=')[0];eval(src.replace("const E=require('./engine.js');",""));
const specs={a:[5,4,10,['','','S'],'S',0],b:[5,5,13,['','','S'],'S',1],c:[5,4,10,['','','D'],'D',0],d:[5,4,11,['','','M'],'M',0]};
const [W,H,n,types,need,near]=specs[process.argv[2]];let best=null,bs=-1;
for(let it=0;it<3e5;it++){const rows=build(W,H,n,types);const f=rows.join(' ').split(' ').filter(t=>t!=='.');
 if(f.length<n||!f.some(t=>t[0]===need))continue;
 const g=E.parse({rows});let s=0,close=0,wrong=0;
 g.forEach((r,y)=>r.forEach((c,x)=>{if(!c)return;const sim=E.simulate(g,x,y);if(sim.solved)s++;else{wrong++;const rung=sim.ev.filter(e=>!e.muted).length;if(f.length-rung<=2)close++}}));
 if(s!==1)continue;const score=near?close/wrong:1-close/wrong;
 if(score>bs){bs=score;best=rows}if(!near&&bs>0.8)break;if(near&&bs>=0.6)break}
console.log(JSON.stringify({rows:best,score:bs}));
