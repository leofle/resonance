// v2.14 desktop MOUSE: each physical click selects exactly once; ▶ Play always uses the last-clicked tile (Chromium + WebKit).
// Also: a tile click during the chain's tail selects at once; the safety net never charges a life for a mismatched start.
const pw=require('playwright-core');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
(async()=>{for(const [name,lo] of [['chromium',{executablePath:'/usr/bin/google-chrome',args:['--autoplay-policy=no-user-gesture-required']}],['webkit',{}]]){
 const b=await pw[name].launch(lo);const p=await b.newPage({viewport:{width:1280,height:900}});const errs=[],warns=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='warning')warns.push(m.text())});
 await p.addInitScript(()=>{localStorage.res214Hints='[0,1,2,3,4,5,6,7,8,9]';localStorage.removeItem('res214State')});await p.goto('http://localhost:8765/index.html');await p.waitForTimeout(300);
 await p.evaluate(()=>{const o=play;window.PLAYS=[];window.play=function(x,y,f){if(!busy&&!locked)PLAYS.push(x+'_'+y);return o(x,y,f)};const s=setSel;window.SELS=0;window.setSel=function(x,y){SELS++;return s(x,y)}});
 const T=s=>`[${name} mouse] ${s}`,E=(f,a)=>p.evaluate(f,a);
 const ctr=async s=>{const bb=await p.locator(s).boundingBox();return[bb.x+bb.width/2,bb.y+bb.height/2]};
 const click=async(s,hold=0)=>{const [x,y]=await ctr(s);await p.mouse.move(x,y);await p.mouse.down();if(hold)await p.waitForTimeout(hold);await p.mouse.up()};
 const idle=async()=>{await p.waitForFunction(()=>!busy,null,{timeout:15000});await p.waitForTimeout(1950)};
 const fresh=async()=>{await E(()=>{dropState(6);load(6);PLAYS=[];SELS=0});await p.waitForTimeout(60);return E(()=>{const o=[];grid.forEach((r,y)=>r.forEach((c,x)=>{if(c&&kind(c)!=='rot')o.push([x,y])}));return o})};
 const id=t=>`#c${t[0]}_${t[1]}`;
 for(const gap of [0,30,100,300])for(const hold of [0,90]){const ts=await fresh();await click(id(ts[0]),hold);await p.waitForTimeout(250);
  const s0=await E(()=>SELS);await click(id(ts[4]),hold);ok(await E(()=>SELS)-s0===1,T(`gap ${gap}ms hold ${hold}ms: one click = exactly one select`));
  if(gap)await p.waitForTimeout(gap);await click('#play',hold);await p.waitForTimeout(40);
  ok(await E(()=>PLAYS.join(','))===ts[4].join('_'),T(`gap ${gap}ms hold ${hold}ms: Play runs the last-clicked tile (${await E(()=>PLAYS.join(','))})`));await idle()}
 {const ts=await fresh();await p.click(id(ts[0]),{delay:0});await p.click(id(ts[5]),{delay:0});await p.click('#play',{delay:0});await p.waitForTimeout(40);ok(await E(()=>PLAYS.join(','))===ts[5].join('_'),T('page.click delay 0: Play uses the last-clicked tile'));await idle()}
 {const ts=await fresh();await click(id(ts[2]));await click(id(ts[2]));ok(await E(()=>sel&&sel.x+'_'+sel.y)===ts[2].join('_')&&await E(()=>document.querySelectorAll('.tile.sel').length)===1,T('click same tile twice: stays selected (no toggle-off)'));
  await click('#play');await p.waitForTimeout(40);ok(await E(()=>PLAYS.join(','))===ts[2].join('_'),T('…and Play runs it'));await idle()}
 {const ts=await fresh();await p.dblclick(id(ts[3]));await click('#play');await p.waitForTimeout(40);ok(await E(()=>PLAYS.join(','))===ts[3].join('_'),T('double-click a tile then Play runs it'));await idle()}
 {const ts=await fresh();await E(([x,y])=>{const el=document.getElementById(`c${x}_${y}`);el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}));el.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true,button:0}));el.click();el.click()},ts[1]);
  ok(await E(()=>sel.x+'_'+sel.y)===ts[1].join('_'),T('duplicated pointerdown/click events: selection is the tile'));await click(id(ts[6]));await click('#play');await p.waitForTimeout(40);ok(await E(()=>PLAYS.join(','))===ts[6].join('_'),T('…then a different tile + Play runs the new tile'));await idle()}
 // click a new tile during the chain's tail (still busy): it selects AT ONCE, Play after the chain uses it
 for(const off of [-500,-200,-50]){const ts=await fresh();await click(id(ts[0]));await click('#play');const end=await E(()=>{const r=simulate(grid,LASTPLAY.x,LASTPLAY.y);return(Math.max(r.melody.length,LEVELS[li].melody.length)-1)*BEAT+500});
  await p.waitForTimeout(Math.max(0,end+off-60));const wasBusy=await E(()=>busy);await click(id(ts[3]));ok(await E(()=>sel.x+'_'+sel.y)===ts[3].join('_'),T(`tile click ${-off}ms before chain end (busy=${wasBusy}) selects at once`));
  await p.waitForFunction(()=>!busy);await click('#play');await p.waitForTimeout(40);ok(await E(()=>PLAYS.join(','))===ts[0].join('_')+','+ts[3].join('_'),T('…and the next Play runs it'));await idle()}
 // L7 'Tap a tile first' after clicking a dial explains dials
 {await fresh();await click('.tile.rotable .rot >> nth=0');await click('#play');await p.waitForTimeout(60);ok(/dials only turn/i.test(await E(()=>msg.textContent)),T('Play after only turning a dial explains dials can\'t start'))}
 // safety net: Play from a tile other than the last pointed one runs free + warns
 {const ts=await fresh();await click(id(ts[0]));const L0=await E(()=>lives);const w0=warns.length;await E(t=>{sel={x:t[0],y:t[1]};playSel()},ts[5]);await p.waitForTimeout(40);
  ok(await E(()=>busy)&&await E(()=>lives)===L0,T('safety net: start != last pointed tile -> runs, no life charged'));ok(warns.length>w0&&/no life charged/.test(warns[warns.length-1]),T('…and logs a console warning'));await idle();
  await click(id(ts[5]));await click('#play');await p.waitForTimeout(40);ok(await E(()=>lives)===L0-1||await E(()=>won(simulate(grid,LASTPLAY.x,LASTPLAY.y),LEVELS[li].melody)),T('normal pointed Play still costs a life on failure'));await idle()}
 {const ts=await fresh();await click(id(ts[0]));await p.keyboard.press('ArrowRight');const s1=await E(()=>sel.x+'_'+sel.y);const L0=await E(()=>lives);await p.keyboard.press('p');await p.waitForTimeout(40);
  ok(await E(()=>LASTPLAY.x+'_'+LASTPLAY.y)===s1&&(await E(()=>lives)===L0-1||await E(()=>won(simulate(grid,LASTPLAY.x,LASTPLAY.y),LEVELS[li].melody))),T('keyboard move then P counts as pointed (charged normally)'));await idle()}
 ok(!errs.length,T('no page errors '+errs.join(';')));await b.close()}})();
