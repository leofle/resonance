const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome',args:['--autoplay-policy=no-user-gesture-required']});
 const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8765/index.html');await p.evaluate(()=>{localStorage.clear()});
 const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
 const go=async i=>{await p.evaluate(i=>load(i),i);await p.waitForTimeout(50)};
 const toks=()=>p.evaluate(()=>grid.flat().map(c=>c?c.t:'.').join(' '));
 // Level 8 (Turn): rotatable tiles
 await go(7);const t0=await toks();const rot=await p.$$('.tile.rotable');ok(rot.length>0,'rot tiles render with .rot class');
 const id=await rot[0].getAttribute('id');
 await p.click(`#${id} .rot`);const t1=await toks();ok(t1!==t0,'badge click rotates CW');
 await p.click(`#${id}`,{button:'right'});const t1b=await toks();await p.click(`#${id}`,{button:'right'});const t2=await toks();
 ok(t2!==t1,'right-click rotates CCW');
 // long press
 const bb=await (await p.$('#'+id)).boundingBox();await p.mouse.move(bb.x+bb.width/2,bb.y+bb.height/2);await p.mouse.down();await p.waitForTimeout(600);await p.mouse.up();await p.waitForTimeout(100);
 const t3=await toks();ok(t3!==t2,'long-press rotates CCW');ok(!(await p.evaluate(()=>busy)),'long-press did not trigger a play');
 const h=await p.evaluate(()=>history.map(h=>h[2]).join(','));ok(h==='1,3,3,3','history records CW/CCW steps: '+h);
 for(const exp of [t2,t1b,t1,t0]){await p.click('#undo');ok(await toks()===exp,'undo step restores');}
 // badge inside tile
 const inside=await p.evaluate(id=>{const t=document.getElementById(id).getBoundingClientRect(),r=document.querySelector('#'+id+' .rot').getBoundingClientRect();return r.left>=t.left&&r.right<=t.right&&r.top>=t.top&&r.bottom<=t.bottom},id);ok(inside,'rotate badge sits inside tile');
 // failed chain then undo/restart
 await p.click(`#${id} .rot`);const tr=await toks();
 const wrong=await p.evaluate(()=>{for(let y=0;y<grid.length;y++)for(let x=0;x<grid[0].length;x++)if(grid[y][x]&&!simulate(grid,x,y).solved)return `c${x}_${y}`});
 await p.click('#'+wrong);ok(await p.evaluate(()=>busy),'chain playing (busy)');
 await p.waitForTimeout(400);const sc=await p.evaluate(()=>Math.max(...[...document.querySelectorAll('.tile')].map(t=>{const m=getComputedStyle(t).transform;return m==='none'?1:+m.split('(')[1].split(',')[0]})));ok(sc<=1.061,'max tile scale during ring '+sc.toFixed(3));
 const ov=await p.evaluate(()=>getComputedStyle(board).overflow);ok(ov==='hidden','board overflow hidden');
 await p.waitForFunction(()=>!busy,null,{timeout:8000});ok(await toks()===tr,'after failed chain board unchanged');
 await p.click('#undo');ok(await toks()===t0&&await p.evaluate(()=>history.length)===0,'undo works after failed chain');
 await p.click(`#${id} .rot`);await p.click('#restart');ok(await toks()===t0&&await p.evaluate(()=>history.length)===0,'restart resets rotations + history');
 // solve level 4 and level 5 in UI
 for(const L of [3,4,5,6,9]){await go(L);
  const s=await p.evaluate(()=>{const P=[];grid.forEach((r,y)=>r.forEach((c,x)=>{if(c&&kind(c)==='rot')P.push([x,y])}));
   for(let m=0;m<4**P.length;m++){let mm=m;const ks=P.map(()=>{const k=mm%4;mm=Math.floor(mm/4);return k});
    P.forEach(([x,y],i)=>{for(let k=0;k<ks[i];k++)rotate(grid[y][x])});
    for(let y=0;y<grid.length;y++)for(let x=0;x<grid[0].length;x++)if(grid[y][x]&&simulate(grid,x,y).solved){P.forEach(([x,y],i)=>{for(let k=0;k<(4-ks[i])%4;k++)rotate(grid[y][x])});return{x,y,P,ks}}
    P.forEach(([x,y],i)=>{for(let k=0;k<(4-ks[i])%4;k++)rotate(grid[y][x])})}});
  for(let i=0;i<s.P.length;i++)for(let k=0;k<s.ks[i];k++)await p.click(`#c${s.P[i][0]}_${s.P[i][1]} .rot`);
  await p.click(`#c${s.x}_${s.y}`);await p.waitForTimeout(700);
  if(L===6){const past=await p.$$eval('.tile.past',e=>e.length);const bn=await p.$$eval('.beatno',e=>e.length);ok(past>0&&bn>0,`L7 earlier tiles faded (${past}) and beat numbers shown (${bn})`);await p.screenshot({path:'shot_l7_chain.png'})}
  await p.waitForSelector('#win',{state:'visible',timeout:10000});ok(true,`level ${L+1} solved through UI`);
  await p.screenshot({path:`shot_win_${L+1}.png`});await p.click('#next');await p.waitForTimeout(50);ok(await p.evaluate(()=>li)===(L+1)%10,'Next advances (Play again wraps to 1)');}
 await go(9);await p.screenshot({path:'shot_l10.png'});await go(6);await p.screenshot({path:'shot_l7.png'});
 ok(await p.evaluate(()=>!!MASTER&&AC.destination!==undefined),'master chain created');
 ok(errs.length===0,'no page errors '+errs.join('|'));await b.close()})();
