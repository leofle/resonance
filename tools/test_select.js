// Tap a tile's centre, then ▶ Play: the chain must start from exactly that tile, on every level, for every non-dial tile,
// with a mouse (Chromium) and with touch taps (WebKit, iPhone size). Also: persistent bars/message, Undo reverses Restart,
// dial-target outline only on L1-4, hint popover clear of the board and controls.
const pw=require('playwright-core');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
(async()=>{
 const runs=[['chromium',{executablePath:'/usr/bin/google-chrome',args:['--autoplay-policy=no-user-gesture-required']},{viewport:{width:1280,height:900}},false],
  ['webkit',{},{viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:3},true]];
 for(const [name,lo,co,touch] of runs){const b=await pw[name].launch(lo);const c=await b.newContext(co);
  await c.addInitScript(()=>{window.RES_FRESH_LOAD=1;if(!localStorage.res213Hints)localStorage.res213Hints='[0,1,2,3,4,5,6,7,8,9]'});const p=await c.newPage();
  await p.goto('http://localhost:8765/index.html');await p.waitForTimeout(500);
  const tap=async id=>{const bb=await p.locator('#'+id).boundingBox();const x=bb.x+bb.width/2,y=bb.y+bb.height/2;if(touch)await p.touchscreen.tap(x,y);else await p.mouse.click(x,y)};
  for(let i=0;i<10;i++){await p.evaluate(i=>{load(i);LT.forEach(clearTimeout)},i);
   const ids=await p.evaluate(()=>[...document.querySelectorAll('.tile:not(.rotable)')].map(e=>e.id));let bad=[];
   for(const id of ids.slice(0,6)){await p.evaluate(()=>{if(busy){LT.forEach(clearTimeout);busy=false;resetTiles();playUI()}window.LASTPLAY=null});
    await tap(id);await tap('play');await p.waitForTimeout(30);const lp=await p.evaluate(()=>window.LASTPLAY&&`c${LASTPLAY.x}_${LASTPLAY.y}`);if(lp!==id)bad.push(id+'→'+lp)}
   await p.evaluate(()=>{LT.forEach(clearTimeout);busy=false;resetTiles();playUI()});
   ok(!bad.length,`${name}${touch?' touch':''} L${i+1}: tap tile centre then Play starts from exactly that tile (${ids.slice(0,6).length} tiles)${bad.length?' '+bad.join(','):''}`)}
  // Play right after a failed chain (during the fail message) registers on the first click (L2, L3)
  for(const lv of [1,2]){await p.evaluate(l=>load(l),lv);const ids=await p.evaluate(()=>[...document.querySelectorAll('.tile:not(.rotable)')].map(e=>e.id));
   await tap(ids[0]);await tap('play');await p.waitForFunction(()=>!busy,null,{timeout:15000});
   const won=await p.evaluate(()=>document.getElementById('win').style.display==='flex');if(won){await p.evaluate(()=>{document.getElementById('win').style.display='none'})}
   await tap(ids[1]);await tap('play');await p.waitForTimeout(40);const st=await p.evaluate(()=>({busy,lp:LASTPLAY&&`c${LASTPLAY.x}_${LASTPLAY.y}`}));
   ok(st.busy&&st.lp===ids[1],`${name} L${lv+1}: tap + ONE Play click right after a failed chain starts from the new tile`);
   await p.evaluate(()=>{LT.forEach(clearTimeout);busy=false;resetTiles();playUI()})}
  // persistent bars + message after a failed Play; Undo reverses Restart
  await p.evaluate(()=>load(4));const id=await p.evaluate(()=>document.querySelector('.tile:not(.rotable)').id);
  const dial=await p.evaluate(()=>document.querySelector('.tile.rotable').id);
  await tap(dial);await tap(id);await tap('play');await p.waitForFunction(()=>!busy,null,{timeout:15000});await p.waitForTimeout(2500);
  const after=await p.evaluate(()=>({pb:document.querySelectorAll('.pb').length,bn:document.querySelectorAll('.beatno').length,msg:document.getElementById('msg').textContent,show:document.getElementById('msg').classList.contains('show')}));
  ok(after.pb>0&&after.bn>0&&after.msg&&after.show,`${name}: after a failed Play the rung tiles keep bars + beat numbers and the message stays (${after.pb} bars, "${after.msg}")`);
  const before=await p.evaluate(()=>({rows:JSON.stringify(grid.map(r=>r.map(c=>c&&c.t))),sel:JSON.stringify(sel),pb:document.querySelectorAll('.pb').length,msg:document.getElementById('msg').textContent}));
  await tap('restart');const mid=await p.evaluate(()=>({pb:document.querySelectorAll('.pb').length,msg:document.getElementById('msg').textContent}));
  ok(mid.pb===0&&!mid.msg,`${name}: Restart is instant and clears bars + message`);
  await tap('undo');const back=await p.evaluate(()=>({rows:JSON.stringify(grid.map(r=>r.map(c=>c&&c.t))),sel:JSON.stringify(sel),pb:document.querySelectorAll('.pb').length,msg:document.getElementById('msg').textContent}));
  ok(back.rows===before.rows&&back.sel===before.sel&&back.pb===before.pb&&back.msg===before.msg,`${name}: Undo reverses a Restart (dials, selection, bars, message)`);
  // next Play clears the old bars/message at once
  await tap('play');await p.waitForTimeout(20);ok(await p.evaluate(()=>!document.getElementById('msg').textContent),`${name}: next Play clears the message`);
  await p.evaluate(()=>{LT.forEach(clearTimeout);busy=false;resetTiles();playUI()});
  // preview shows no bar
  await p.evaluate(()=>load(4));await tap(id);ok(await p.evaluate(()=>document.querySelectorAll('.pb').length===0),`${name}: preview shows no bar`);
  // dial-target outline: L1-4 only
  const ghost=async lv=>{await p.evaluate(l=>load(l),lv);const d=await p.evaluate(()=>{const e=document.querySelector('.tile.rotable');return e&&e.id});if(!d)return null;await tap(d);return p.evaluate(()=>document.querySelectorAll('.ghost').length)};
  const g3=await ghost(2),g5=await ghost(4),g9=await ghost(8);ok(g3>0&&g5===0&&g9===0,`${name}: dial-target outline on L3 (${g3}), none on L5 (${g5}) / L9 (${g9})`);
  // hint popover clear of board and controls; closing it hits nothing below
  await p.evaluate(()=>{load(3);showHint()});const geo=await p.evaluate(()=>{const R=e=>e.getBoundingClientRect();const h=R(hintpop),bd=R(board),bar=R(document.getElementById('bar'));
   const ov=(a,b)=>!(a.bottom<=b.top||a.top>=b.bottom||a.right<=b.left||a.left>=b.right);return{board:ov(h,bd),bar:ov(h,bar)}});
  ok(!geo.board&&!geo.bar,`${name}: hint popover overlaps neither the board nor the controls row`);
  const a0=await p.evaluate(()=>attempts);await tap('hintpop');ok(await p.evaluate(a0=>hintpop.hidden&&attempts===a0&&!busy,a0),`${name}: closing the hint triggers nothing underneath`);
  await b.close()}
})();
