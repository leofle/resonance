// v2.2: squeeze every level onto 6 pitch levels (0..5). Per level: try monotone merges of the 8 old pitches
// (adjacent pairs collapse); keep the first map under which the level is still valid. If none works, re-roll
// the level's pitches in 0..5 on the same board (same structure => same full-coverage/decoy counts).
// Valid = exactly one config plays the tune, solution chords have no doubled pitch, (levels >=3) a decoy shares
// the first note, every delay is load-bearing.  usage: node tools/remap6.js  (rewrites final.json)
const fs=require('fs');const E=require('../engine.js');const {solve}=require('./solve.js');
const F=require('../final.json');
const setP=(lv,f)=>({...lv,rows:lv.rows.map(r=>r.split(/\s+/).map(t=>t==='.'?t:t.split(':')[0]+':'+f(+t.split(':')[1])).join(' '))});
function sol(lv){const s=solve({...lv,melody:null});return s}
function valid(lv,i,intended){// intended = description of the original solution
 const s=solve(lv);if(s.match.length!==1||s.match[0]!==intended)return false;
 if(lv.melody.some(ch=>new Set(ch).size!==ch.length))return false;
 if(i>=2&&!s.cover.some(c=>c.d!==intended&&E.chordEq(c.melody[0],lv.melody[0])))return false;
 for(let y=0;y<6;y++){const toks=lv.rows[y].split(' ');for(let x=0;x<6;x++){const t=toks[x];if(t[0]!=='D')continue;
  const rows=lv.rows.map((rr,yy)=>yy!==y?rr:rr.split(' ').map((tt,xx)=>xx===x?t.slice(1):tt).join(' '));if(solve({...lv,rows}).match.length)return false}}
 return true}
function withMelody(lv,intended){const s=solve({...lv,melody:[]});const c=s.cover.find(c=>c.d===intended);return{...lv,melody:c.melody}}
const maps=[];for(let a=0;a<7;a++)for(let b=a+1;b<7;b++){const m=[];let v=0;for(let p=0;p<8;p++){m.push(v);if(p<7&&p!==a&&p!==b)v++}maps.push(m)}
const out=F.map((lv,i)=>{const intended=solve(lv).match[0];const used=new Set(lv.rows.join(' ').split(/\s+/).filter(t=>t!=='.').map(t=>+t.split(':')[1]));
 if(Math.max(...used)<=5&&used.size<=6){console.error(`L${i+1} already <=6`);return lv}
 for(const m of maps){const nl=withMelody(setP(lv,p=>m[p]),intended);if(valid(nl,i,intended)){console.error(`L${i+1} ${lv.name}: map ${m.join('')}`);return nl}}
 for(let t=0;t<20000;t++){const nl=withMelody(setP(lv,()=>Math.floor(Math.random()*6)),intended);if(valid(nl,i,intended)){console.error(`L${i+1} ${lv.name}: re-rolled pitches (try ${t})`);return nl}}
 throw new Error('no 6-pitch assignment for L'+(i+1))});
fs.writeFileSync(__dirname+'/../final.json',JSON.stringify(out,null,0).replace(/\},\{/g,'},\n{')+'\n');
