const {chromium}=require('playwright-core');const fs=require('fs');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const p=await b.newPage();
 await p.goto('http://localhost:8765/index.html');
 const r=await p.evaluate(async()=>{load(3);let sx,sy;grid.forEach((r,y)=>r.forEach((c,x)=>{if(c&&simulate(grid,x,y).solved){sx=x;sy=y}}));
  const {ev}=simulate(grid,sx,sy);const SR=44100;const last=ev[ev.length-1].beat*.18;const winT=last+.5;
  AC=new OfflineAudioContext(1,Math.ceil(SR*(winT+3)),SR);MASTER=master(AC);
  let n=0;const exp=[];ev.forEach(e=>{if(e.muted)return;exp.push({t:e.beat*.18,i:n});note(n++,e.beat*.18)});
  // win(): chord notes [0,2,3,5] staggered 60ms, vol .18, dur 2.4
  [0,2,3,5].forEach((s,i)=>{note(s,winT+i*.06,.18,2.4);exp.push({t:winT+i*.06,i:s,win:1})});
  const buf=await AC.startRendering();return{data:Array.from(buf.getChannelData(0)),exp,SR,tap:[sx+1,sy+1]}});
 const d=r.data,SR=r.SR,h=Buffer.alloc(44+d.length*2);
 h.write('RIFF',0);h.writeUInt32LE(36+d.length*2,4);h.write('WAVEfmt ',8);h.writeUInt32LE(16,16);h.writeUInt16LE(1,20);h.writeUInt16LE(1,22);h.writeUInt32LE(SR,24);h.writeUInt32LE(SR*2,28);h.writeUInt16LE(2,32);h.writeUInt16LE(16,34);h.write('data',36);h.writeUInt32LE(d.length*2,40);
 d.forEach((v,i)=>h.writeInt16LE(Math.max(-32768,Math.min(32767,Math.round(v*32767))),44+i*2));
 fs.writeFileSync('level4_solve.wav',h);fs.writeFileSync('level4_expected.json',JSON.stringify({exp:r.exp,tap:r.tap,peakFloat:d.reduce((m,v)=>Math.max(m,Math.abs(v)),0)}));
 console.log('tap',r.tap,'notes',r.exp.length);await b.close()})();
