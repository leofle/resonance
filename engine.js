// Tokens: "." empty | ">" "<" "^" "v" arrow | "S-" split left+right | "S|" split up+down
// "D?" delay arrow (rings one beat later) | "M?" mute arrow (needs 2 hits) | "R?" rotatable arrow
const DIRS={'>':[1,0],'<':[-1,0],'^':[0,-1],'v':[0,1]};
const ROT={'>':'v','v':'<','<':'^','^':'>'};
const LEVELS=[
 {name:"First Note",hint:"Tap a tile. Its ring travels where the arrow points.",rows:["> > > >"]},
 {name:"Corner",hint:"Rings follow every turn.",rows:["> > v",". . v","< < <"]},
 {name:"Gaps",hint:"A ring jumps empty space to the next tile.",rows:["> . . v","^ . . .","^ . . v","^ < . <"]},
 {name:"Split",hint:"Split tiles send the ring both ways.",rows:[". ^ .","< S- >",". ^ ."].map(r=>r)},
 {name:"Branches",hint:"Find the one tile that reaches everything.",rows:["v . . S- .","> . . ^ .","S| . . ^ .","v . . . .","> > > ^ ."]},
 {name:"Delay",hint:"Hourglass tiles wait one extra beat.",rows:["> D> v",". . v","^ < <"]},
 {name:"Hush",hint:"Muted tiles only ring on their second hit.",rows:["S- > M> > .",". . . . .","^ . . . ."]},
 {name:"Two Voices",hint:"Two rings must reach the muted tile.",rows:["> v . .",". > M> v","S| ^ . v",". . . v",". . . <"]},
 {name:"Turn",hint:"Tap the ↻ on a tile to rotate it before you play.",rows:["> R> . v",". . . v","R> . . <"]},
 {name:"Finale",hint:"Everything you've learned, together.",rows:["R> . S| . R<",". . . . .","M^ . D^ . v","^ . . . v","^ < R> < <"]},
];
function parse(lv){return lv.rows.map(r=>r.trim().split(/\s+/).map(t=>t==='.'?null:{t:t}));}
function tileDirs(c){const k=c.t;if(k==='S-')return['<','>'];if(k==='S|')return['^','v'];return[k[k.length-1]];}
function kind(c){const k=c.t;if(k[0]==='S')return'split';if(k.length===1)return'arrow';return{D:'delay',M:'mute',R:'rot'}[k[0]];}
function rotate(c){const d=c.t[1];c.t='R'+ROT[d];}
// Timing rule (build 4): rings resolve beat by beat. A mute tile only rings when
// TWO OR MORE rings arrive on the SAME beat; a lone ring is absorbed (no memory carries
// over to later beats). Delay tiles emit 2 beats after ringing instead of 1, which
// shifts arrival times and so decides whether rings coincide at a mute.
// returns events [{beat,x,y,muted?}] and solved flag
function targets(grid,x0,y0){const H=grid.length,W=grid[0].length,out=[];
 for(const d of tileDirs(grid[y0][x0])){let [dx,dy]=DIRS[d],x=x0+dx,y=y0+dy;
  while(x>=0&&y>=0&&x<W&&y<H&&!grid[y][x]){x+=dx;y+=dy;}
  if(x>=0&&y>=0&&x<W&&y<H)out.push([x,y]);}return out}
function simulate(grid,sx,sy){
 const rung=new Set(),ev=[],arr={0:{[sx+','+sy]:1}};
 const total=grid.flat().filter(Boolean).length;
 for(let b=0;b<=Math.max(...Object.keys(arr).map(Number));b++){const here=arr[b];if(!here)continue;
  for(const key of Object.keys(here).sort()){if(rung.has(key))continue;const [x,y]=key.split(',').map(Number);const c=grid[y][x];
   if(kind(c)==='mute'&&here[key]<2){ev.push({beat:b,x,y,muted:true});continue;}
   rung.add(key);ev.push({beat:b,x,y});const lag=kind(c)==='delay'?2:1;
   for(const [tx,ty] of targets(grid,x,y)){const k2=tx+','+ty;(arr[b+lag]=arr[b+lag]||{})[k2]=(arr[b+lag][k2]||0)+1;}}}
 return{ev,solved:rung.size===total};
}
if(typeof module!=='undefined')module.exports={LEVELS,parse,simulate,kind,rotate,targets};
