// Resonance v2 engine (shared by node tools and the browser build).
// Board: always 6x6. Token = "<type>:<pitch>" or "." for empty.
//   type: ">" "<" "^" "v" arrow | "S-" split left+right | "S|" split up+down
//         "D?" delay arrow (passes the ring on 2 beats later) | "M?" mute arrow | "R?" rotatable arrow
//   pitch: 0..7, index into the pentatonic SCALE; a fixed property of the tile.
// Rules: tap one tile (beat 0). A ringing tile sends a ring in its direction(s) to the next tile
// (skipping empties), arriving one beat later (two for delay). Each tile rings once.
// Mute tiles ring only when TWO OR MORE rings arrive on the SAME beat; a lone ring is absorbed.
// Melody of a chain = for each beat 0..last, the sorted pitches of tiles that ring on that beat.
// Level is won when every tile rings AND the chain's melody equals the level's target melody.
const N=6;
const SCALE=[0,2,4,7,9,12,14,16];           // semitones above BASE_HZ (major pentatonic, 1.5 octaves)
const BASE_HZ=220;
const DIRS={'>':[1,0],'<':[-1,0],'^':[0,-1],'v':[0,1]};
const ROT={'>':'v','v':'<','<':'^','^':'>'};
const LEVELS=[];
function parse(lv){return lv.rows.map(r=>r.trim().split(/\s+/).map(t=>{if(t==='.')return null;const [k,p]=t.split(':');return{t:k,p:+(p||0)}}));}
function tileDirs(c){const k=c.t;if(k==='S-')return['<','>'];if(k==='S|')return['^','v'];return[k[k.length-1]];}
function kind(c){const k=c.t;if(k[0]==='S')return'split';if(k.length===1)return'arrow';return{D:'delay',M:'mute',R:'rot'}[k[0]];}
function rotate(c){const d=c.t[1];c.t='R'+ROT[d];}
function targets(grid,x0,y0){const H=grid.length,W=grid[0].length,out=[];
 for(const d of tileDirs(grid[y0][x0])){let [dx,dy]=DIRS[d],x=x0+dx,y=y0+dy;
  while(x>=0&&y>=0&&x<W&&y<H&&!grid[y][x]){x+=dx;y+=dy;}
  if(x>=0&&y>=0&&x<W&&y<H)out.push([x,y]);}return out}
// returns events [{beat,x,y,muted?}], solved (all tiles rang), melody [[pitches] per beat]
function simulate(grid,sx,sy){
 const rung=new Set(),ev=[],arr={0:{[sx+','+sy]:1}};
 const total=grid.flat().filter(Boolean).length;
 for(let b=0;b<=Math.max(...Object.keys(arr).map(Number));b++){const here=arr[b];if(!here)continue;
  for(const key of Object.keys(here).sort()){if(rung.has(key))continue;const [x,y]=key.split(',').map(Number);const c=grid[y][x];
   if(kind(c)==='mute'&&here[key]<2){ev.push({beat:b,x,y,muted:true});continue;}
   rung.add(key);ev.push({beat:b,x,y});const lag=kind(c)==='delay'?2:1;
   for(const [tx,ty] of targets(grid,x,y)){const k2=tx+','+ty;(arr[b+lag]=arr[b+lag]||{})[k2]=(arr[b+lag][k2]||0)+1;}}}
 return{ev,solved:rung.size===total,melody:melodyOf(grid,ev)};
}
function melodyOf(grid,ev){const r=ev.filter(e=>!e.muted);if(!r.length)return[];const L=Math.max(...r.map(e=>e.beat))+1;
 const m=Array.from({length:L},()=>[]);r.forEach(e=>m[e.beat].push(grid[e.y][e.x].p));m.forEach(c=>c.sort((a,b)=>a-b));return m}
const chordEq=(a,b)=>!!a&&!!b&&a.length===b.length&&a.every((v,i)=>v===b[i]);
const melodyEq=(a,b)=>a.length===b.length&&a.every((c,i)=>chordEq(c,b[i]));
// first beat index where played melody diverges from target (-1 if equal)
function firstWrongBeat(m,t){const L=Math.max(m.length,t.length);for(let i=0;i<L;i++)if(!chordEq(m[i]||[],t[i]||[]))return i;return -1}
const freq=p=>BASE_HZ*Math.pow(2,SCALE[p]/12);
if(typeof module!=='undefined')module.exports={N,SCALE,BASE_HZ,LEVELS,parse,simulate,kind,rotate,targets,melodyOf,chordEq,melodyEq,firstWrongBeat,freq};
