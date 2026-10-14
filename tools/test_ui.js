// v2 UI test (Playwright + system Chrome). Server must serve the repo on :8765.
const {chromium}=require('playwright-core');
const FIND=`(want)=>{const P=[];grid.forEach((r,y)=>r.forEach((c,x)=>{if(c&&kind(c)==='rot')P.push([x,y])}));const out=[];
 for(let m=0;m<4**P.length;m++){let mm=m;const ks=P.map(()=>{const k=mm%4;mm=Math.floor(mm/4);return k});P.forEach(([x,y],i)=>{for(let k=0;k<ks[i];k++)rotate(grid[y][x])});
  for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(grid[y][x]){const r=simulate(grid,x,y);const mel=melodyEq(r.melody,LEVELS[li].melody);
   if(want==='win'&&r.solved&&mel||want==='decoy'&&r.solved&&!mel||want==='silent'&&!r.solved)out.push({x,y,P,ks})}
  P.forEach(([x,y],i)=>{for(let k=0;k<(4-ks[i])%4;k++)rotate(grid[y][x])})}return out}`;
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage({viewport:{width:1024,height:900}});const errs=[],bad=[];p.on('pageerror',e=>errs.push(e.message));
 p.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url())});p.on('console',m=>{if(m.type()==='error')bad.push('console: '+m.text())});
 const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
 await p.goto('http://localhost:8765/index.html');await p.evaluate(()=>localStorage.clear());await p.reload();
 const go=async i=>{await p.evaluate(i=>load(i),i);await p.waitForTimeout(60)};
 const toks=()=>p.evaluate(()=>grid.flat().map(c=>c?c.t:'.').join(' '));
 const find=w=>p.evaluate(`(${FIND})('${w}')`);
 const applyAndTap=async s=>{for(let i=0;i<s.P.length;i++)for(let k=0;k<s.ks[i];k++)await p.click(`#c${s.P[i][0]}_${s.P[i][1]} .rot`);await p.click(`#c${s.x}_${s.y}`)};
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
 const any=(await find('silent'))[0];await p.click(`#c${any.x}_${any.y}`);await p.waitForTimeout(100);await p.click('#restart');await p.waitForTimeout(1500);
 ok(await p.evaluate(()=>!busy&&!document.querySelector('.rung')&&!msg.textContent),'restart mid-chain cancels the chain');
 // decoy: full coverage but wrong melody (level 3)
 await go(2);const dec=(await find('decoy'))[0];await applyAndTap(dec);await p.waitForSelector('#msg.show',{timeout:8000});
 const dm=await p.evaluate(()=>({t:msg.textContent,bad:document.querySelectorAll('#strip .col.bad').length,ok:document.querySelectorAll('#strip .col.ok').length,silent:document.querySelectorAll('.silent').length}));
 const exp=await p.evaluate(s=>{const r=simulate(grid,s.x,s.y);const T=LEVELS[li].melody;return T.filter((c,i)=>chordEq(r.melody[i]||[],c)).length+' of '+T.length+' beats right'},dec);
 ok(dm.t===exp&&dm.bad===0&&dm.ok===0&&dm.silent===0,`L3 decoy chain: "${dm.t}" (expected "${exp}"), no per-beat strip marks`);
 await p.screenshot({path:'tools/shots/decoy_L3.png'});
 await p.waitForFunction(()=>!busy,null,{timeout:8000});ok(await p.evaluate(()=>msg.textContent===''&&msg.getAttribute('aria-hidden')==='true'),'note cleared + aria-hidden after hide');
 // non-coverage failure: silent tiles highlighted (levels 4, 8, 10)
 for(const L of [3,7,9]){await go(L);const w=await p.evaluate(`(()=>{let best=null;for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(grid[y][x]){const r=simulate(grid,x,y);if(!r.solved){const rung=new Set(r.ev.filter(e=>!e.muted).map(e=>e.x+','+e.y));const n=grid.flat().filter(Boolean).length-rung.size;if(!best||n<best.n)best={id:'c'+x+'_'+y,n}}}return best})()`);
  await p.click('#'+w.id);await p.waitForSelector('.tile.silent',{timeout:10000});
  const got=await p.evaluate(()=>({n:document.querySelectorAll('.tile.silent').length,msg:msg.textContent}));
  ok(got.n===w.n&&/^\d+ of \d+ beats right · /.test(got.msg)&&got.msg.endsWith(`${w.n} tile${w.n===1?'':'s'} silent`),`L${L+1} silent tiles: ${got.n} / "${got.msg}"`);
  await p.screenshot({path:`tools/shots/fail_L${L+1}.png`});await p.waitForFunction(()=>!busy,null,{timeout:8000})}
 // solve every level through the UI
 for(let L=0;L<10;L++){await go(L);const sols=await find('win');ok(sols.length===1,`L${L+1}: exactly one winning config in page`);await applyAndTap(sols[0]);
  if(L===5){await p.waitForTimeout(700);ok(await p.evaluate(()=>[...document.querySelectorAll('.tile.delay')].every(t=>{const b=t.querySelector('.beatno'),d=t.querySelector('.dl');if(!b)return true;const r1=b.getBoundingClientRect(),r2=d.getBoundingClientRect(),T=t.getBoundingClientRect();return r1.bottom<=r2.top&&r1.left>=T.left&&r1.right<=T.right})),'delay a→b pill inside tile, no overlap with +1 beat')}
  if(L===7){await p.waitForTimeout(600);await p.screenshot({path:'tools/shots/chain_L8.png'})}
  await p.waitForSelector('#win',{state:'visible',timeout:10000});ok(await p.evaluate(()=>!document.querySelector('#strip .col.ok,#strip .col.bad')),`level ${L+1} solved through UI (no strip marks)`);
  if(L===0){await p.click('#dots i[data-j="2"]');ok(await p.evaluate(()=>li===2&&document.getElementById('win').style.display==='none'&&!busy),'level dot clickable over RESOLVED overlay');continue}
  await p.click('#next');await p.waitForTimeout(50);ok(await p.evaluate(()=>li)===(L+1)%10,'Next advances (Play again wraps)')}
 ok(await p.evaluate(()=>!!MASTER),'master gain + limiter chain created');
 const fav=await p.request.get('http://localhost:8765/favicon.ico');ok(fav.status()===200,'favicon.ico served (200)');
 ok(errs.length===0,'no page errors '+errs.join('|'));ok(bad.length===0,'no 404s / console errors '+bad.join('|'));await b.close()})();
