// Renders level 3 offline in Chrome with the game's own synth: the winning chain (+ win chord) and a
// full-coverage decoy chain (wrong melody -> clash sounds). Writes level3_solve.wav, level3_decoy.wav + expectations.
const {chromium}=require('playwright-core');const fs=require('fs');
function wav(path,d,SR){const h=Buffer.alloc(44+d.length*2);h.write('RIFF',0);h.writeUInt32LE(36+d.length*2,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(SR,24);h.writeUInt32LE(SR*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(d.length*2,40);
 d.forEach((v,i)=>h.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(v*32767))),44+i*2));fs.writeFileSync(path,h)}
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const p=await b.newPage();await p.goto('http://localhost:8765/index.html');
 const out=await p.evaluate(async()=>{load(2);const tgt=LEVELS[li].melody;const SR=44100;const res={};
  // every dial setting x every non-dial start (dials must be set: level 3 is the dial level)
  const P=[];grid.forEach((r,y)=>r.forEach((c,x)=>{if(c&&kind(c)==='rot')P.push([x,y])}));const cfgs=[];
  for(let m=0;m<4**P.length;m++){const g=parse(LEVELS[li]);let mm=m;P.forEach(([x,y])=>{const k=mm%4;mm=Math.floor(mm/4);for(let i=0;i<k;i++)rotate(g[y][x])});
   for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(g[y][x]&&kind(g[y][x])!=='rot'){const r=simulate(g,x,y);if(r.solved)cfgs.push({x,y,r,g,win:melodyEq(r.melody,tgt)})}}
  const T3=JSON.stringify(tgt.slice(0,3));cfgs.sort((a,b)=>(JSON.stringify(b.r.melody.slice(0,3))===T3)-(JSON.stringify(a.r.melody.slice(0,3))===T3));   // prefer a decoy matching the first 3 beats
  for(const kindName of ['solve','decoy']){const c=cfgs.find(c=>c.win===(kindName==='solve'));const r=c.r;const beats=Math.max(r.melody.length,tgt.length);
   AC=new OfflineAudioContext(1,Math.ceil(SR*((beats-1)*.18+3.5)),SR);MASTER=master(AC);
   // same scheduling as play(): tile notes per beat, clash on wrong beats, thud for absorbed mute hits
   for(let bt=0;bt<beats;bt++){const good=chordEq(r.melody[bt]||[],tgt[bt]||[]);const t=bt*BEAT/1000;
    r.ev.filter(e=>e.beat===bt).forEach(e=>{const cc=c.g[e.y][e.x];if(e.muted){thud(t);return}note(cc.p,t);if(!good)clash(cc.p,t)})}
   if(c.win)[0,2,4,5].forEach((q,i)=>note(q,(beats-1)*.18+.5+i*.06,.18,2.4));
   const buf=await AC.startRendering();res[kindName]={data:Array.from(buf.getChannelData(0)),melody:r.melody,tap:[c.x+1,c.y+1],beats}}
  return{res,tgt,SR}});
 for(const k of ['solve','decoy'])wav(`level3_${k}.wav`,out.res[k].data,out.SR);
 fs.writeFileSync('tools/level3_expected.json',JSON.stringify({target:out.tgt,solve:{melody:out.res.solve.melody,tap:out.res.solve.tap},decoy:{melody:out.res.decoy.melody,tap:out.res.decoy.tap}}));
 console.log('solve tap',out.res.solve.tap,'decoy tap',out.res.decoy.tap,'target',JSON.stringify(out.tgt),'decoy',JSON.stringify(out.res.decoy.melody));await b.close()})();
