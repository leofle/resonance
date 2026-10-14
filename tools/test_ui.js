// v2 UI test (Playwright + system Chrome). Server must serve the repo on :8765.
const {chromium}=require('playwright-core');
const FIND=`(want)=>{const P=[];grid.forEach((r,y)=>r.forEach((c,x)=>{if(c&&kind(c)==='rot')P.push([x,y])}));const out=[];
 for(let m=0;m<4**P.length;m++){let mm=m;const ks=P.map(()=>{const k=mm%4;mm=Math.floor(mm/4);return k});P.forEach(([x,y],i)=>{for(let k=0;k<ks[i];k++)rotate(grid[y][x])});
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(grid[y][x]&&kind(grid[y][x])!=='rot'){const r=simulate(grid,x,y);const mel=melodyEq(r.melody,LEVELS[li].melody);
   if(want==='win'&&r.solved&&mel||want==='decoy'&&r.solved&&!mel||want==='silent'&&!r.solved)out.push({x,y,P,ks})}
  P.forEach(([x,y],i)=>{for(let k=0;k<(4-ks[i])%4;k++)rotate(grid[y][x])})}return out}`;
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage({viewport:{width:1024,height:900}});const errs=[],bad=[];p.on('pageerror',e=>errs.push(e.message));
 p.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url())});p.on('console',m=>{if(m.type()==='error')bad.push('console: '+m.text())});
 const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
 await p.addInitScript(()=>{if(!localStorage.res2Hints)localStorage.res2Hints='[0,1,2,3,4,5,6,7,8,9]'});await p.goto('http://localhost:8765/index.html');await p.evaluate(()=>localStorage.clear());await p.reload();
 const go=async i=>{await p.evaluate(i=>load(i),i);await p.waitForTimeout(60)};
 const toks=()=>p.evaluate(()=>grid.flat().map(c=>c?c.t:'.').join(' '));
 const find=w=>p.evaluate(`(${FIND})('${w}')`);
 const applyAndTap=async s=>{for(let i=0;i<s.P.length;i++)for(let k=0;k<s.ks[i];k++)await p.click(`#c${s.P[i][0]}_${s.P[i][1]} .rot`);await p.click(`#c${s.x}_${s.y}`);await p.click('#play')};
 ok(await p.evaluate(()=>li)===0,'fresh load starts at level 1');
 await p.evaluate(()=>{localStorage.res2Done='[0,1,2]'});await p.reload();ok(await p.evaluate(()=>li)===3,'reload starts at first unsolved level (4)');
 await p.evaluate(()=>localStorage.clear());
 ok(await p.evaluate(()=>!localStorage.resDone),'old v1 progress key not used');
 // fixed board size + 36 cells on every level
 const sizes=new Set();for(let i=0;i<10;i++){await go(i);const r=await p.evaluate(()=>{const b=board.getBoundingClientRect();return{w:b.width,h:b.height,c:board.children.length,slots:document.querySelectorAll('.slot').length,strip:document.querySelectorAll('#strip .col').length,m:LEVELS[li].melody.length}});
  sizes.add(r.w+'x'+r.h);ok(r.c===36&&r.strip===r.m,`L${i+1}: 36 cells (${r.slots} empty slots), melody strip ${r.strip} beats`)}
 ok(sizes.size===1,'board box identical on all levels: '+[...sizes]);
 // rotation on level 7
 await go(6);const t0=await toks();const id=await (await p.$('.tile.rotable')).getAttribute('id');
 await p.click(`#${id} .rot`);const t1=await toks();ok(t1!==t0,'badge click rotates CW');
 await p.click(`#${id}`,{button:'right'});ok(await toks()===t0,'right-click rotates CCW (back to start)');
 const bb=await (await p.$('#'+id)).boundingBox();await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.mouse.down();await p.waitForTimeout(600);await p.mouse.up();await p.waitForTimeout(100);
 const t3=await toks();ok(t3!==t0&&!(await p.evaluate(()=>busy)),'long-press rotates CCW without playing');
 for(const exp of [t0,t1,t0]){await p.click('#undo');ok(await toks()===exp,'undo step restores');}
 await p.click(`#${id} .rot`);await p.click('#restart');ok(await toks()===t0,'restart resets rotations');
 await p.click(`#${id} .rot`);await p.waitForTimeout(700);ok(await toks()===t1,'rotate click right after Restart registers (and no stray long-press CCW)');
 await p.click('#restart');
 // restart during a running chain cancels it
 const any=(await find('silent'))[0];await p.click(`#c${any.x}_${any.y}`);await p.click('#play');await p.waitForTimeout(100);await p.click('#restart');await p.waitForTimeout(1500);
 ok(await p.evaluate(()=>!busy&&!document.querySelector('.rung')&&!msg.textContent),'restart mid-chain cancels the chain');
 // v2.2: no pitch digits anywhere on the strip or the tiles (marker labels "+1 beat" / "×2" are not pitch), no data-p leak
 for(let i=0;i<10;i++){await go(i);const r=await p.evaluate(()=>{const st=document.getElementById('strip');
   const tileTxt=[...document.querySelectorAll('.tile')].map(t=>{const c=t.cloneNode(true);c.querySelectorAll('.dl,.badge').forEach(e=>e.remove());return c.textContent}).join('');
   const cols=[...st.querySelectorAll('.col')].map(c=>[...c.querySelectorAll('i')].map(b=>{const r=b.getBoundingClientRect();return{w:r.width,h:r.height,l:r.left,r:r.right}}));
   return{strip:st.textContent,tileTxt,dp:document.querySelectorAll('[data-p]').length,pb:document.querySelectorAll('.pb').length,cols,H:st.getBoundingClientRect().height,
    want:LEVELS[li].melody.map(ch=>ch.map(p=>PH(p)))}});
  const sepOK=r.cols.every(c=>c.every((b,k)=>k===0||b.l>=c[k-1].r+2)&&c.every(b=>b.w>=10));
  const hOK=r.cols.every((c,j)=>c.every((b,k)=>Math.abs(b.h-r.want[j][k]/100*(r.H-20))<2.5));
  ok(!/\d/.test(r.strip)&&!/\d/.test(r.tileTxt)&&r.dp===0&&r.pb===0&&sepOK&&hOK&&r.H>=115,`L${i+1}: no digits on strip/tiles, no pitch shown before ringing, bars height=pitch, chord bars side by side (strip ${r.H}px)`)}
 // pitch revealed after a tile rings; survives fail-reset + Restart; resets on level change
 await go(0);const sol1=(await find('win'))[0];const wrong1=await p.evaluate(s=>{for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(grid[y][x]&&!(x===s.x&&y===s.y))return{x,y}},sol1);
 await p.click(`#c${wrong1.x}_${wrong1.y}`);await p.click('#play');await p.waitForTimeout(200);
 const rungNow=await p.evaluate(()=>[...document.querySelectorAll('.tile.rung')].map(e=>e.id));
 ok(rungNow.length>0&&await p.evaluate(ids=>ids.every(id=>document.querySelector('#'+id+' .pb')),rungNow),'pitch bar appears on a tile as soon as it rings');
 await p.waitForFunction(()=>!busy,null,{timeout:8000});
 const revealedIds=await p.evaluate(s=>{const r=simulate(grid,s.x,s.y);return[...new Set(r.ev.filter(e=>!e.muted).map(e=>`c${e.x}_${e.y}`))]},wrong1);
 const chk=()=>p.evaluate(ids=>{const all=[...document.querySelectorAll('.tile')];const withPb=all.filter(t=>t.querySelector('.pb')).map(t=>t.id).sort();
   const hOK=all.filter(t=>t.querySelector('.pb')).every(t=>{const [x,y]=t.id.slice(1).split('_').map(Number);const b=t.querySelector('.pb').getBoundingClientRect(),T=t.getBoundingClientRect();return Math.abs(b.height/T.height*100-PH(grid[y][x].p)*.8)<1.5&&b.width>=T.width*.18});
   return JSON.stringify(withPb)===JSON.stringify(ids.slice().sort())&&hOK},revealedIds);
 ok(await chk(),`after the failed chain exactly the ${revealedIds.length} tiles that rang show their pitch bar (height = pitch)`);
 await p.evaluate(()=>render());ok(await chk(),'pitch bars of the attempt survive a re-render (resize)');
 const nb=()=>p.evaluate(()=>document.querySelectorAll('.pb').length);
 await p.click('#restart');ok(await nb()===0,'Restart clears the pitch bars');
 await p.click(`#c${wrong1.x}_${wrong1.y}`);await p.click('#play');await p.waitForFunction(()=>!busy,null,{timeout:8000});
 const other=await p.evaluate(()=>{const ids=[...document.querySelectorAll('.tile')].map(t=>t.id);return ids.find(id=>!document.querySelector('#'+id+' .pb'))});
 await p.click('#'+other);await p.click('#play');await p.waitForTimeout(60);ok(await p.evaluate(id=>{const pb=[...document.querySelectorAll('.pb')].map(e=>e.parentNode);return pb.length>=1&&pb.some(e=>e.id===id)&&pb.every(e=>e.classList.contains('rung'))},other),'next attempt clears the previous attempt\'s bars (only tiles rung in this attempt show one)');
 await p.waitForFunction(()=>!busy,null,{timeout:8000});
 await go(6);{const s=(await find('decoy'))[0]||(await find('silent'))[0];await p.click(`#c${s.x}_${s.y}`);await p.click('#play');await p.waitForFunction(()=>!busy,null,{timeout:8000});
  ok(await nb()>0,'L7: bars shown after an attempt');await p.click('.tile.rotable .rot');ok(await nb()===0,'rotating a dial clears the bars');await p.click('#restart')}
 await go(0);await p.click(`#c${wrong1.x}_${wrong1.y}`);await p.click('#play');await p.waitForTimeout(300);await go(1);ok(await nb()===0,'bars reset on level change');
 // stale strip highlight: Listen interrupted by a tap, by Restart, and after normal end
 {const hl=()=>p.evaluate(()=>document.querySelectorAll('#strip .col.hl').length);await go(2);
  await p.click('#strip');await p.waitForTimeout(400);await p.click('#c0_0');await p.waitForTimeout(1300);ok(await hl()===0,'Listen interrupted by a tap leaves no highlighted column');
  await p.waitForFunction(()=>!busy,null,{timeout:8000});await p.click('#strip');await p.waitForTimeout(400);await p.click('#restart');await p.waitForTimeout(600+await p.evaluate(()=>LEVELS[li].melody.length*180));
  ok(await hl()===0,'Listen interrupted by Restart leaves no highlighted column (after the auto-Listen too)');
  await p.click('#strip');await p.waitForTimeout(250+await p.evaluate(()=>LEVELS[li].melody.length*180));ok(await hl()===0,'no highlighted column after Listen ends')}
 // no click lockout: tap right after Restart, rapid rotates, click right after a rotate
 {await go(0);await p.click('#restart');const s=(await find('win'))[0];const bx=await (await p.$(`#c${s.x}_${s.y}`)).boundingBox();await p.mouse.click(bx.x+bx.width/2,bx.y+bx.height/2);await p.click('#play');
  ok(await p.evaluate(()=>busy),'tile click immediately after Restart registers');await p.click('#restart');
  await go(6);const T0=await toks();const rid=await (await p.$('.tile.rotable')).getAttribute('id');const rb=await (await p.$(`#${rid} .rot`)).boundingBox();
  for(let i=0;i<4;i++)await p.mouse.click(rb.x+rb.width/2,rb.y+rb.height/2,{delay:5});
  ok(await toks()===T0&&await p.evaluate(()=>history.length===4),'4 rapid badge clicks = 4 rotations (back to start)');
  const db=await (await p.$('#'+rid)).boundingBox();await p.mouse.dblclick(db.x+db.width*.35,db.y+db.height*.6);ok(await p.evaluate(()=>history.length===6),'double-click on dial body = 2 rotations');
  const s7=(await find('win'))[0];const bb7=await (await p.$(`#c${s7.x}_${s7.y}`)).boundingBox();
  for(let i=0;i<s7.P.length;i++)for(let k=0;k<s7.ks[i];k++){const r=await (await p.$(`#c${s7.P[i][0]}_${s7.P[i][1]} .rot`)).boundingBox();await p.mouse.click(r.x+r.width/2,r.y+r.height/2,{delay:5})}
  await p.mouse.click(bb7.x+bb7.width/2,bb7.y+bb7.height/2);await p.click('#play');ok(await p.evaluate(()=>busy),'tap right after rapid rotates registers');
  await p.waitForSelector('#win',{state:'visible',timeout:10000});ok(true,'L7 solved via rapid rotates + immediate tap');await p.evaluate(()=>{document.getElementById('win').style.display='none'});await p.click('#restart')}
 // pointer: real mouse clicks at each tile's bounding-box centre hit that tile on every level
 for(let i=0;i<10;i++){await go(i);const miss=await p.evaluate(()=>[...document.querySelectorAll('.tile')].filter(t=>{const r=t.getBoundingClientRect();const e=document.elementFromPoint(r.left+r.width/2,r.top+r.height/2);return !e||e.closest('.tile')!==t}).map(t=>t.id));
  ok(miss.length===0,`L${i+1}: elementFromPoint at every tile centre is that tile ${miss.join(',')}`)}
 for(const L of [0,6]){await go(L);const s=(await find('win'))[0];await p.evaluate(s=>{s.P.forEach(([x,y],i)=>{for(let k=0;k<s.ks[i];k++)rotate(grid[y][x])});render()},s);
  const bx=await (await p.$(`#c${s.x}_${s.y}`)).boundingBox();await p.mouse.move(0,0);await p.mouse.click(bx.x+bx.width/2,bx.y+bx.height/2);await p.click('#play');
  await p.waitForTimeout(50);ok(await p.evaluate(s=>busy&&!!document.querySelector(`#c${s.x}_${s.y}.rung`),s),`L${L+1}: page.mouse.click at tile bbox centre selects it and ▶ Play starts the chain from it`);
  await p.waitForSelector('#win',{state:'visible',timeout:10000});ok(true,`L${L+1}: coordinate click solves`);await p.evaluate(()=>{document.getElementById('win').style.display='none'})}
 // touch: hasTouch context, tap a tile, tap the rotate badge, 600 ms touch hold = CCW
 {const tc=await b.newContext({viewport:{width:412,height:860},hasTouch:true,isMobile:true,deviceScaleFactor:2});const tp=await tc.newPage();await tp.addInitScript(()=>{if(!localStorage.res2Hints)localStorage.res2Hints='[0,1,2,3,4,5,6,7,8,9]'});tp.on('pageerror',e=>errs.push('touch: '+e.message));
  await tp.goto('http://localhost:8765/index.html');await tp.evaluate(()=>load(6));await tp.waitForTimeout(100);
  const tt=()=>tp.evaluate(()=>grid.flat().map(c=>c?c.t:'.').join(' '));const T0=await tt();
  const rid=await (await tp.$('.tile.rotable')).getAttribute('id');const rb=await (await tp.$(`#${rid} .rot`)).boundingBox();
  await tp.touchscreen.tap(rb.x+rb.width/2,rb.y+rb.height/2);await tp.waitForTimeout(100);const T1=await tt();
  ok(T1!==T0&&!(await tp.evaluate(()=>busy)),'touch tap on rotate badge rotates CW (no chain)');
  const tb=await (await tp.$('#'+rid)).boundingBox();const cdp=await tc.newCDPSession(tp);const pt=[{x:tb.x+tb.width*.35,y:tb.y+tb.height*.6}];
  await cdp.send('Input.dispatchTouchEvent',{type:'touchStart',touchPoints:pt});await tp.waitForTimeout(650);await cdp.send('Input.dispatchTouchEvent',{type:'touchEnd',touchPoints:[]});await tp.waitForTimeout(150);
  ok(await tt()===T0&&!(await tp.evaluate(()=>busy)),'touch hold 650 ms on rotatable rotates CCW without playing');
  const s=await tp.evaluate(`(${FIND})('win')`).then(a=>a[0]);await tp.evaluate(s=>{s.P.forEach(([x,y],i)=>{for(let k=0;k<s.ks[i];k++)rotate(grid[y][x])});render()},s);
  const sb=await (await tp.$(`#c${s.x}_${s.y}`)).boundingBox();await tp.touchscreen.tap(sb.x+sb.width/2,sb.y+sb.height/2);await tp.tap('#play');await tp.waitForTimeout(50);
  ok(await tp.evaluate(s=>busy&&!!document.querySelector(`#c${s.x}_${s.y}.rung`),s),'touch tap at tile centre selects, ▶ Play tap starts the chain from it');
  await tp.waitForSelector('#win',{state:'visible',timeout:10000});ok(true,'L7 solved by touch taps');await tc.close()}
 // level dots: buttons with accessible names, aria-current on the current level, keyboard operable
 await go(4);const dots=await p.evaluate(()=>[...document.querySelectorAll('#dots > *')].map(d=>({tag:d.tagName,label:d.getAttribute('aria-label'),cur:d.getAttribute('aria-current'),tab:d.tabIndex})));
 const names=await p.evaluate(()=>LEVELS.map(l=>l.name));
 ok(dots.length===10&&dots.every((d,j)=>d.tag==='BUTTON'&&d.label.startsWith(`Level ${j+1}: ${names[j]}`)&&d.tab===0&&(j===4?d.cur!==null:d.cur===null)),'dots are focusable buttons "Level N: Name", aria-current only on current');
 const snap=await p.locator('#dots').ariaSnapshot();ok(/navigation "Levels"/.test(snap)&&(snap.match(/button "Level \d+: [^"]+"/g)||[]).length===10,'a11y tree: 10 named buttons in Levels nav');
 await p.focus('#dots .dot[data-j="0"]');await p.keyboard.press('Tab');await p.keyboard.press('Tab');ok(await p.evaluate(()=>document.activeElement.dataset.j)==='2','Tab moves focus along the dots');
 await p.keyboard.press('Enter');await p.waitForTimeout(60);ok(await p.evaluate(()=>li===2&&document.querySelector('#dots .dot[aria-current]').dataset.j==='2'),'Enter on a focused dot loads that level');
 await p.keyboard.press(' ');await p.waitForTimeout(60);ok(await p.evaluate(()=>li===2),'Space on focused dot keeps working');
 // dials never start a chain: clicking / tapping the dial body rotates CW instead of playing
 await go(6);{const T0=await toks();const did=await (await p.$('.tile.rotable')).getAttribute('id');const db=await (await p.$('#'+did)).boundingBox();
  await p.mouse.click(db.x+db.width*.35,db.y+db.height*.6);await p.waitForTimeout(80);const T1=await toks();
  ok(T1!==T0&&!(await p.evaluate(()=>busy||!!document.querySelector('.rung'))),'click on dial body rotates CW, never starts a chain');
  await p.evaluate(id=>{const [x,y]=id.slice(1).split('_').map(Number);play(x,y)},did);ok(!(await p.evaluate(()=>busy)),'play() refuses a dial as start');
  ok(/never start/.test(await p.evaluate(()=>LEVELS[li].hint)),'level 7 hint says dials never start the chain');await p.click('#restart')}
 // v2.5: strip tap replays the tune, drag does not, keyboard works; ♪ affordance; role=button
 {await go(8);await p.waitForTimeout(2200);const hl=()=>p.evaluate(()=>document.querySelectorAll('#strip .col.hl').length);
  const sb=await (await p.$('#strip')).boundingBox();await p.mouse.click(sb.x+sb.width/2,sb.y+sb.height/2);await p.waitForTimeout(100);
  ok(await hl()===1,'clean tap on the strip plays the tune');await p.waitForTimeout(2200);
  await p.mouse.move(sb.x+sb.width-30,sb.y+sb.height/2);await p.mouse.down();await p.mouse.move(sb.x+30,sb.y+sb.height/2,{steps:8});await p.mouse.up();await p.waitForTimeout(150);
  ok(await hl()===0,'dragging the strip does not play the tune');
  await p.mouse.move(sb.x+sb.width/2,sb.y+sb.height/2);await p.mouse.down();await p.waitForTimeout(700);await p.mouse.up();await p.waitForTimeout(120);ok(await hl()===0,'a long press on the strip does not play');
  await p.focus('#strip');await p.keyboard.press('Enter');await p.waitForTimeout(80);ok(await hl()===1,'Enter on the focused strip plays');await p.waitForTimeout(2200);
  await p.keyboard.press(' ');await p.waitForTimeout(80);ok(await hl()===1,'Space on the focused strip plays');await p.waitForTimeout(2200);
  const a=await p.evaluate(()=>({role:S.getAttribute('role'),label:S.getAttribute('aria-label'),tab:S.tabIndex,note:!!document.querySelector('#strip #note'),listen:!!document.getElementById('listen')}));
  ok(a.role==='button'&&/play/i.test(a.label)&&a.tab===0&&a.note&&!a.listen,'strip is a focusable role=button with aria-label and a ♪ icon; no Listen button')}
 // dial badge never overlaps the arrow glyph (all dial tiles, all 4 orientations)
 {let bad=0,n=0;for(const L of [6,7,8,9]){await go(L);for(let k=0;k<4;k++){const r=await p.evaluate(()=>[...document.querySelectorAll('.tile.rotable')].map(t=>{const a=t.querySelector('svg:not(.hg) path').getBoundingClientRect(),b=t.querySelector('.rot').getBoundingClientRect();return a.right<=b.left||a.left>=b.right||a.bottom<=b.top||a.top>=b.bottom}));
   n+=r.length;bad+=r.filter(x=>!x).length;await p.evaluate(()=>{grid.forEach((row,y)=>row.forEach((c,x)=>{if(c&&kind(c)==='rot'){rotate(c);refreshTile(x,y)}}))})}}
  ok(n>0&&bad===0,`rotate badge never overlaps the arrow glyph bbox (${n} dial/orientation checks)`)}
 // hint popover: auto on mechanic levels once per device, tap / first move dismisses, ? reopens, no layout shift
 {const st=()=>p.evaluate(()=>!document.getElementById('hintpop').hidden);const geo=()=>p.evaluate(()=>JSON.stringify([board.getBoundingClientRect(),S.getBoundingClientRect()]));
  await p.evaluate(()=>{localStorage.res2Hints='[]'});await go(1);const g0=await geo();await p.evaluate(()=>hideHint());const g1=await geo();
  await p.evaluate(()=>{localStorage.res2Hints='[]'});await go(2);ok(await st()&&/split/i.test(await p.evaluate(()=>hintpop.textContent)),'L3 (new mechanic) shows the hint popover on first visit');
  ok(g0===g1,'popover does not shift the layout');
  await p.click('#hintpop');ok(!(await st()),'tap dismisses the popover');await go(3);await go(2);ok(!(await st()),'shown only once per level per device');
  await go(3);ok(!(await st()),'L4 (no new mechanic) does not auto-show');await p.click('#help');ok(await st()&&/Listen|only one/i.test(await p.evaluate(()=>hintpop.textContent)),'? reopens the hint on any level');
  await p.click('#help');ok(!(await st()),'? toggles it closed');await p.click('#help');
  const t0=await p.evaluate(()=>{for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(grid[y][x]&&y>=3)return 'c'+x+'_'+y});await p.click('#'+t0);ok(!(await st()),'first move dismisses the popover');
  await p.waitForFunction(()=>!busy,null,{timeout:8000});
  const auto=await p.evaluate(()=>{const out=[];for(let i=0;i<10;i++){localStorage.res2Hints='[]';load(i);if(!hintpop.hidden)out.push(i+1)}localStorage.res2Hints='[0,1,2,3,4,5,6,7,8,9]';hideHint();return out});
  ok(JSON.stringify(auto)==='[1,2,3,5,6,7]',`auto-shown on levels ${auto} (new mechanics: basics, gaps, split, mute, delay, dial)`)}
 // v2.6: tap = select + preview (no chain/bar/attempt); ▶ Play runs it; keyboard; preview cap
 {await go(2);await p.waitForTimeout(2200);/* let the auto-Listen finish */await p.evaluate(()=>{window.NOTES=[];const o=note;window.note=(...a)=>{NOTES.push(a[0]);return o(...a)}});
  ok(await p.evaluate(()=>document.getElementById('play').disabled),'▶ Play disabled with nothing selected');
  const ids=await p.evaluate(()=>[...document.querySelectorAll('.tile:not(.rotable)')].map(t=>t.id));
  const a0=await p.evaluate(()=>attempts);await p.click('#'+ids[0]);await p.waitForTimeout(400);
  const r=await p.evaluate(id=>({busy,rung:document.querySelectorAll('.rung').length,pb:document.querySelectorAll('.pb').length,sel:[...document.querySelectorAll('.tile.sel')].map(e=>e.id),attempts,previews,notes:NOTES.slice(),p:(()=>{const [x,y]=id.slice(1).split('_').map(Number);return grid[y][x].p})(),ring:getComputedStyle(document.getElementById(id)).outlineStyle,dis:document.getElementById('play').disabled}),ids[0]);
  ok(!r.busy&&r.rung===0&&r.pb===0&&r.attempts===a0,'preview tap: no chain, no pitch bar, not an attempt');
  ok(r.notes.length===1&&r.notes[0]===r.p,'preview plays exactly that tile\'s note');
  ok(r.sel.length===1&&r.sel[0]===ids[0]&&r.ring==='solid'&&!r.dis,'tile selected with a highlight ring; ▶ Play enabled');
  await p.click('#'+ids[1]);ok(await p.evaluate(id=>{const s=[...document.querySelectorAll('.tile.sel')];return s.length===1&&s[0].id===id},ids[1]),'tapping another tile moves the selection');
  await p.click('#play');await p.waitForTimeout(80);ok(await p.evaluate(a0=>busy&&attempts===a0+1&&document.querySelectorAll('.pb').length>0,a0),'▶ Play runs the chain, counts one attempt, shows pitch bars');
  await p.waitForFunction(()=>!busy,null,{timeout:8000});
  await p.keyboard.press('Escape');await p.focus('#board');const before=await p.evaluate(()=>sel&&[sel.x,sel.y]);await p.keyboard.press('ArrowRight');await p.keyboard.press('ArrowDown');
  const after=await p.evaluate(()=>sel&&[sel.x,sel.y]);ok(JSON.stringify(before)!==JSON.stringify(after)&&await p.evaluate(()=>selectable(sel.x,sel.y)),'arrow keys move the selection');
  await p.keyboard.press('p');await p.waitForTimeout(60);ok(await p.evaluate(()=>busy),'P plays from the selection');await p.waitForFunction(()=>!busy,null,{timeout:8000});
  await p.focus('#board');await p.keyboard.press('Enter');await p.waitForTimeout(60);ok(await p.evaluate(()=>busy),'Enter on the board plays');await p.waitForFunction(()=>!busy,null,{timeout:8000});
  await go(6);const d=await (await p.$('.tile.rotable')).getAttribute('id');await p.click('#'+d);ok(await p.evaluate(()=>!document.querySelector('.tile.rotable.sel')&&!sel),'dials rotate on tap and cannot be selected');
  // cap
  await p.evaluate(()=>{PREVIEW_LIMIT=3;load(2)});const cnt=()=>p.evaluate(()=>({n:previews-window.P0,txt:document.getElementById('pvc').textContent,vis:!document.getElementById('pvc').hidden}));
  await p.evaluate(()=>{window.P0=previews});for(let i=0;i<5;i++)await p.click('#'+ids[i%ids.length]);let c1=await cnt();
  ok(c1.n===3&&c1.vis&&/0/.test(c1.txt),`PREVIEW_LIMIT=3: only 3 previews sound, counter shows "${c1.txt}"`);
  await p.click('#play');await p.waitForFunction(()=>!busy,null,{timeout:8000});ok(/3/.test((await cnt()).txt),'previews refill on ▶ Play');
  await p.evaluate(()=>{PREVIEW_LIMIT=null;load(2)});ok(!(await cnt()).vis,'cap off by default: no counter')}
 // decoy: full coverage but wrong melody (level 3)
 await go(2);const dec=(await find('decoy'))[0];await applyAndTap(dec);await p.waitForSelector('#msg.show',{timeout:8000});
 const dm=await p.evaluate(()=>({t:msg.textContent,bad:document.querySelectorAll('#strip .col.bad').length,ok:document.querySelectorAll('#strip .col.ok').length,silent:document.querySelectorAll('.silent').length}));
 const exp=await p.evaluate(s=>{const r=simulate(grid,s.x,s.y);const T=LEVELS[li].melody;return T.filter((c,i)=>chordEq(r.melody[i]||[],c)).length+' of '+T.length+' beats right'},dec);
 ok(dm.t===exp&&dm.bad===0&&dm.ok===0&&dm.silent===0,`L3 decoy chain: "${dm.t}" (expected "${exp}"), no per-beat strip marks`);
 await p.screenshot({path:'tools/shots/decoy_L3.png'});
 await p.waitForFunction(()=>!busy,null,{timeout:8000});ok(await p.evaluate(()=>msg.textContent===''&&msg.getAttribute('aria-hidden')==='true'),'note cleared + aria-hidden after hide');
 // non-coverage failure: silent tiles highlighted (levels 4, 8, 10)
 for(const L of [3,7,9]){await go(L);const w=await p.evaluate(`(()=>{let best=null;for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(grid[y][x]&&kind(grid[y][x])!=="rot"){const r=simulate(grid,x,y);if(!r.solved){const rung=new Set(r.ev.filter(e=>!e.muted).map(e=>e.x+','+e.y));const n=grid.flat().filter(Boolean).length-rung.size;if(!best||n<best.n)best={id:'c'+x+'_'+y,n}}}return best})()`);
  await p.click('#'+w.id);await p.click('#play');await p.waitForSelector('.tile.silent',{timeout:10000});
  const got=await p.evaluate(()=>({n:document.querySelectorAll('.tile.silent').length,msg:msg.textContent}));
  ok(got.n===w.n&&/^\d+ of \d+ beats right · /.test(got.msg)&&got.msg.endsWith(`${w.n} tile${w.n===1?'':'s'} silent`),`L${L+1} silent tiles: ${got.n} / "${got.msg}"`);
  await p.screenshot({path:`tools/shots/fail_L${L+1}.png`});await p.waitForFunction(()=>!busy,null,{timeout:8000})}
 // solve every level through the UI
 for(let L=0;L<10;L++){await go(L);const sols=await find('win');ok(sols.length===1,`L${L+1}: exactly one winning config in page`);await applyAndTap(sols[0]);
  if(L===5){await p.waitForTimeout(700);ok(await p.evaluate(()=>[...document.querySelectorAll('.tile.delay')].every(t=>{const b=t.querySelector('.beatno'),d=t.querySelector('.dl');if(!b)return true;const r1=b.getBoundingClientRect(),r2=d.getBoundingClientRect(),T=t.getBoundingClientRect();return r1.bottom<=r2.top&&r1.left>=T.left&&r1.right<=T.right})),'delay a→b pill inside tile, no overlap with +1 beat')}
  if(L===7){await p.waitForTimeout(600);await p.screenshot({path:'tools/shots/chain_L8.png'})}
  await p.waitForSelector('#win',{state:'visible',timeout:10000});ok(await p.evaluate(()=>!document.querySelector('#strip .col.ok,#strip .col.bad')),`level ${L+1} solved through UI (no strip marks)`);
  if(L===0){await p.click('#dots .dot[data-j="2"]');ok(await p.evaluate(()=>li===2&&document.getElementById('win').style.display==='none'&&!busy),'level dot clickable over RESOLVED overlay');continue}
  await p.click('#next');await p.waitForTimeout(50);ok(await p.evaluate(()=>li)===(L+1)%10,'Next advances (Play again wraps)')}
 ok(await p.evaluate(()=>!!MASTER),'master gain + limiter chain created');
 const fav=await p.request.get('http://localhost:8765/favicon.ico');ok(fav.status()===200,'favicon.ico served (200)');
 ok(errs.length===0,'no page errors '+errs.join('|'));ok(bad.length===0,'no 404s / console errors '+bad.join('|'));await b.close()})();
