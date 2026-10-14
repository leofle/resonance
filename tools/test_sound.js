// Audio unlock test in Chromium (system Chrome, default autoplay policy) and WebKit (desktop + iPhone-like touch).
// Before any gesture: no AudioContext, banner shown, icon 🔇. After a tap/click: context 'running', banner hidden, icon 🔊,
// master gain > 0, silent keep-alive <audio> playing, sound toggle mutes/unmutes.
const pw=require('playwright-core');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
(async()=>{
 const runs=[['chromium',{executablePath:'/usr/bin/google-chrome'},{}],['webkit',{},{}],['webkit',{},{viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:3}]];
 for(const [name,lo,ctxo] of runs){const tag=name+(ctxo.hasTouch?' (touch/iPhone-size)':'');
  const b=await pw[name].launch(lo);const c=await b.newContext(ctxo);await c.addInitScript(()=>{if(!localStorage.res2Hints)localStorage.res2Hints='[0,1,2,3,4,5,6,7,8,9]'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8765/index.html');await p.waitForTimeout(800);
  const pre=await p.evaluate(()=>({ac:AC===null,banner:!document.getElementById('unlock').hidden,icon:document.getElementById('sound').textContent,st:document.getElementById('sound').dataset.state,fb:!!(window.AudioContext||window.webkitAudioContext)}));
  ok(pre.ac&&pre.banner&&pre.icon==='🔇'&&pre.st==='none',`${tag}: no AudioContext before a gesture, "Tap to enable sound" shown, icon 🔇`);
  ok(pre.fb,`${tag}: AudioContext/webkitAudioContext available`);
  const bx=await (await p.$('.tile')).boundingBox();
  if(ctxo.hasTouch)await p.touchscreen.tap(bx.x+bx.width/2,bx.y+bx.height/2);else await p.mouse.click(bx.x+bx.width/2,bx.y+bx.height/2);
  await p.waitForFunction(()=>AC&&AC.state==='running',null,{timeout:5000}).catch(()=>{});
  await p.waitForTimeout(500);const post=await p.evaluate(()=>({st:AC&&AC.state,banner:document.getElementById('unlock').hidden,icon:document.getElementById('sound').textContent,g:MASTER&&MASTER.gain.value,keep:!!KEEP&&!KEEP.paused,busy,sel:!!sel}));
  ok(post.st==='running',`${tag}: context 'running' after first ${ctxo.hasTouch?'tap':'click'} (state ${post.st})`);
  ok(post.banner&&post.icon==='🔊',`${tag}: banner hidden, icon 🔊 after unlock`);
  ok(post.g>0,`${tag}: master gain ${post.g} > 0`);ok(post.keep,`${tag}: silent looping <audio> keep-alive playing`);
  ok(!post.busy&&post.sel,`${tag}: the unlocking tap previews/selects the tile (no chain)`);
  if(ctxo.hasTouch)await p.tap('#play');else await p.click('#play');await p.waitForTimeout(60);ok(await p.evaluate(()=>busy),`${tag}: ▶ Play starts the chain`);
  await p.waitForFunction(()=>!busy,null,{timeout:10000});
  await p.click('#sound');ok(await p.evaluate(()=>!soundOn&&document.getElementById('sound').textContent==='🔇'),`${tag}: toggle mutes (🔇)`);
  await p.click('#sound');ok(await p.evaluate(()=>soundOn&&document.getElementById('sound').textContent==='🔊'),`${tag}: toggle unmutes (🔊)`);
  // fresh page: banner button unlocks and plays the tune
  await p.close();const p2=await c.newPage();await p2.goto('http://localhost:8765/index.html');await p2.waitForTimeout(800);
  await p2.click('#unlock');await p2.waitForFunction(()=>AC&&AC.state==='running',null,{timeout:5000}).catch(()=>{});await p2.waitForTimeout(500);
  ok(await p2.evaluate(()=>AC.state==='running'&&document.getElementById('unlock').hidden&&!!document.querySelector('#strip .col.hl')),`${tag}: banner button unlocks, hides and plays the tune`);
  // keyboard gesture unlocks too
  const p3=await c.newPage();await p3.goto('http://localhost:8765/index.html');await p3.keyboard.press('l');await p3.waitForFunction(()=>AC&&AC.state==='running',null,{timeout:5000}).catch(()=>{});
  ok(await p3.evaluate(()=>!!AC&&AC.state==='running'),`${tag}: keydown (L) unlocks`);
  ok(errs.length===0,`${tag}: no page errors ${errs.join('|')}`);await b.close()}
})();
