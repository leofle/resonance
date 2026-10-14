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
// returns events [{beat,x,y}] and solved flag
function simulate(grid,sx,sy){
 const H=grid.length,W=grid[0].length,rung=new Set(),hits={},ev=[];
 let q=[{b:0,x:sx,y:sy}];
 const total=grid.flat().filter(Boolean).length;
 while(q.length){q.sort((a,b)=>a.b-b.b);const p=q.shift();const c=grid[p.y][p.x];const key=p.x+','+p.y;
  if(rung.has(key))continue;
  if(kind(c)==='mute'){hits[key]=(hits[key]||0)+1;if(hits[key]<2){ev.push({beat:p.b,x:p.x,y:p.y,muted:true});continue;}}
  rung.add(key);ev.push({beat:p.b,x:p.x,y:p.y});
  const lag=kind(c)==='delay'?2:1;
  for(const d of tileDirs(c)){let [dx,dy]=DIRS[d],x=p.x+dx,y=p.y+dy;
   while(x>=0&&y>=0&&x<W&&y<H&&!grid[y][x]){x+=dx;y+=dy;}
   if(x>=0&&y>=0&&x<W&&y<H)q.push({b:p.b+lag,x,y});}
 }
 return{ev,solved:rung.size===total};
}
if(typeof module!=='undefined')module.exports={LEVELS,parse,simulate,kind,rotate};
