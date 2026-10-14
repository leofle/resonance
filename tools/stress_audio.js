const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const p=await b.newPage();await p.goto('http://localhost:8765/index.html');
 console.log(await p.evaluate(async()=>{const out={};for(const lim of [true,false]){AC=new OfflineAudioContext(1,44100*3,44100);MASTER=lim?master(AC):AC.destination;
  for(let k=0;k<4;k++)for(let i=0;i<SCALE.length;i++)note(i,k*.18);for(let i=0;i<4;i++)note(i,.8,.18,2.4);
  const d=(await AC.startRendering()).getChannelData(0);let m=0;for(const v of d)m=Math.max(m,Math.abs(v));out[lim?'withLimiter':'raw']=m}return out}));await b.close()})();
