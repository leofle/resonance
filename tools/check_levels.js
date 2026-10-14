// v2.7 level audit: per level, solutions, decoys, same notes-per-beat shape, decoys matching the tune's first 3 beats,
// non-dial tiles (besides the start) sharing the first pitch, dials (all scrambled = must be turned), load-bearing mechanics.
const E=require('./levels.js');const {solve}=require('./solve.js');const shp=m=>m.map(c=>c.length).join(',');
const INTRO={2:'R',3:'S',5:'M',6:'D'};   // level index -> mechanic introduced there (dial 3, split 4, mute 6, delay 7)
let bad=0;
E.LEVELS.forEach((lv,i)=>{const s=solve(lv);const T=lv.melody;const dec=s.cover.filter(c=>!s.match.includes(c.d));
 const sol=s.match[0]||'';const m=/tap \((\d),(\d)\)/.exec(sol);const sx=+m[1]-1,sy=+m[2]-1;
 const g=E.parse(lv);const fp=g[sy][sx].p;let shared=0,dials=0;g.forEach((r,y)=>r.forEach((c,x)=>{if(!c)return;if(E.kind(c)==='rot')dials++;else if(!(x===sx&&y===sy)&&c.p===fp)shared++}));
 const turned=(sol.match(/CW×/g)||[]).length;
 const m3=dec.filter(c=>E.melodyEq(c.melody.slice(0,3),T.slice(0,3))).length;const same=dec.filter(c=>shp(c.melody)===shp(T)).length;
 // load-bearing: replacing each tile of the introduced kind with a plain arrow leaves no winning config
 let lb='-';const k=INTRO[i];if(k&&k!=='R'){lb='yes';lv.rows.forEach((r,y)=>r.split(' ').forEach((t,x)=>{if(t==='.')return;const [tk,p]=t.split(':');if(tk[0]!==k)return;
   const alts=k==='S'?(tk==='S-'?['<','>']:['^','v']):[tk[1]];for(const a of alts){const rows=lv.rows.map((rr,yy)=>yy!==y?rr:rr.split(' ').map((tt,xx)=>xx===x?a+':'+p:tt).join(' '));const w=solve({...lv,rows}).match.length;if(k==='M'?w<2:w>0)lb='NO'}}))}   // mute: without it another start would also win
 if(k==='R')lb=turned===dials&&dials>0?'yes':'NO';
 const okL=s.match.length===1&&(i<2||(dials>=1&&turned>=1&&shared>=3&&m3>=2))&&lb!=='NO';if(!okL)bad=1;
 console.log(`${okL?'OK ':'BAD'} L${i+1} ${lv.name} | tiles ${s.tiles} | full-ring ${s.cover.length} | solutions ${s.match.length} | decoys ${dec.length} | same shape ${same} | match first 3 beats ${m3} | share first pitch ${shared} | dials ${dials} (turned in solution ${turned}) | intro load-bearing ${lb} | ${sol}`)});
process.exitCode=bad;
