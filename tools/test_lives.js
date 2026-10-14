// v2.12 lives + points + tap reliability (Chromium mouse + WebKit iPhone touch). Server must serve the repo on :8765.
const pw=require('playwright-core');
const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
(async()=>{
 const runs=[['chromium',{executablePath:'/usr/bin/google-chrome',args:['--autoplay-policy=no-user-gesture-required']},{viewport:{width:1280,height:900}},false],
  ['webkit',{},{viewport:{width:390,height:844},hasTouch:true,isMobile:true,deviceScaleFactor:3},true]];
 for(const [name,lo,co,touch] of runs){const b=await pw[name].launch(lo);const c=await b.newContext(co);
  await c.addInitScript(()=>{if(!localStorage.res212Hints)localStorage.res212Hints='[0,1,2,3,4,5,6,7,8,9]'});const p=await c.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8765/index.html');await p.evaluate(()=>localStorage.removeItem('res212Best'));await p.reload();await p.waitForTimeout(400);
  const T=s=>`[${name}] ${s}`;
  const tapXY=async(x,y)=>{if(touch)await p.touchscreen.tap(x,y);else await p.mouse.click(x,y)};
  const tap=async sel=>{const bb=await p.locator(sel).boundingBox();await tapXY(bb.x+bb.width/2,bb.y+bb.height/2)};
  const E=(f,a)=>p.evaluate(f,a);const lives=()=>E(()=>lives);
  const idle=async()=>{await p.waitForFunction(()=>!busy,null,{timeout:15000});await p.waitForTimeout(80)};
  const toks=()=>E(()=>grid.flat().map(c=>c?c.t:'.').join(' '));
  // winning start + dial turns for the current level (from a fresh load)
  const SOL=()=>E(()=>{const {P,ks}=solutionKs();const g=parse(LEVELS[li]);P.forEach(([x,y],i)=>{for(let k=0;k<ks[i];k++)rotate(g[y][x])});
   for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(g[y][x]&&kind(g[y][x])!=='rot'&&won(simulate(g,x,y),LEVELS[li].melody))return{P,ks,x,y};return null});
  const loseStart=()=>E(()=>{for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(grid[y][x]&&kind(grid[y][x])!=='rot'&&!won(simulate(grid,x,y),LEVELS[li].melody))return[x,y]});
  const applySol=async s=>{for(let i=0;i<s.P.length;i++)for(let k=0;k<s.ks[i];k++){await tap(`#c${s.P[i][0]}_${s.P[i][1]} .rot`);await p.waitForTimeout(30)}};
  const winNow=async()=>{const s=await SOL();await applySol(s);await tap(`#c${s.x}_${s.y}`);await tap('#play');await p.waitForFunction(()=>getComputedStyle(document.getElementById('win')).display==='flex',null,{timeout:15000})};

  // --- free actions: preview, rotate, undo, restart
  await E(()=>load(2));await p.waitForTimeout(100);ok(await lives()===3,T('level load: 3 lives'));
  ok(await E(()=>document.querySelectorAll('#lives i:not(.lost)').length)===3,T('3 hearts shown'));
  let [lx,ly]=await loseStart();await tap(`#c${lx}_${ly}`);await p.waitForTimeout(80);ok(await lives()===3,T('tile preview is free'));
  const dial=await E(()=>document.querySelector('.tile.rotable').id);await tap(`#${dial} .rot`);await p.waitForTimeout(80);ok(await lives()===3,T('dial turn is free'));
  await tap('#undo');await p.waitForTimeout(80);ok(await lives()===3,T('undo is free'));
  await tap('#restart');await p.waitForTimeout(80);ok(await lives()===3,T('restart is free'));
  // --- failed Play costs exactly one life; same setup again is free
  [lx,ly]=await loseStart();await tap(`#c${lx}_${ly}`);await tap('#play');await p.waitForTimeout(60);ok(await lives()===2,T('failed Play costs one life (2 left)'));
  ok(await E(()=>document.querySelectorAll('#lives i.lost').length)===1,T('one heart dimmed'));
  await idle();await tap('#play');await p.waitForTimeout(60);ok(await E(()=>busy)&&await lives()===2,T('Play again with same tile + same dials replays for free'));
  await idle();ok(/same setup/.test(await E(()=>msg.textContent)),T('free replay says so: '+await E(()=>msg.textContent)));
  // --- (a) first tap on a new tile after Play ends selects it; a tap during the chain is applied when it ends
  const others=await E(()=>{const o=[];grid.forEach((r,y)=>r.forEach((c,x)=>{if(c&&kind(c)!=='rot'&&!(sel.x===x&&sel.y===y))o.push([x,y])}));return o});
  await tap(`#c${others[0][0]}_${others[0][1]}`);await p.waitForTimeout(40);ok(await E(()=>sel&&sel.x+','+sel.y)===others[0].join(','),T('first tap after a Play ends selects the new tile'));
  await tap(`#c${lx}_${ly}`);await tap('#play');await p.waitForTimeout(60);const L1=await lives();
  await tap(`#c${others[1][0]}_${others[1][1]}`);await idle();await p.waitForTimeout(50);
  ok(await E(()=>sel&&sel.x+','+sel.y)===others[1].join(','),T('tap during a sounding chain selects that tile when the chain ends (not dropped)'));
  await tap('#play');await p.waitForTimeout(60);ok(await E(()=>LASTPLAY.x+','+LASTPLAY.y)===others[1].join(','),T('next Play starts from the newly tapped tile, not the old chain'));
  await idle();
  // --- to 0 lives: lock + overlay
  if(await lives()>0){const s=await E(()=>{for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(grid[y][x]&&kind(grid[y][x])!=='rot'&&!won(simulate(grid,x,y),LEVELS[li].melody)&&!(sel.x===x&&sel.y===y))return[x,y]});
   while(await lives()>0){await tap(`#${dial} .rot`);await p.waitForTimeout(40);await tap(`#c${s[0]}_${s[1]}`);await tap('#play');await p.waitForTimeout(60);await idle()}}
  await p.waitForTimeout(1600);
  ok(await lives()===0&&await E(()=>locked),T('0 lives locks the board'));
  ok(await E(()=>getComputedStyle(document.getElementById('out')).display==='flex')&&/Out of lives/.test(await E(()=>out.textContent)),T('"Out of lives" overlay shown with Restart level'));
  const before=await toks();const selB=await E(()=>JSON.stringify(sel));
  await E(()=>{const d=document.querySelector('.tile.rotable .rot');d.click();const t=[...document.querySelectorAll('.tile:not(.rotable)')][1];t.click();document.getElementById('play').click();document.getElementById('undo').click();document.getElementById('restart').click()});
  await p.waitForTimeout(80);ok(await toks()===before&&await E(()=>JSON.stringify(sel))===selB&&!(await E(()=>busy))&&await lives()===0,T('locked: dial, tile, Play, Undo, Restart do nothing'));
  // --- restart level: 3 lives, new random dials (>=1 wrong), bars + message cleared
  const sol=await SOL();await tap('#relevel');await p.waitForTimeout(150);
  ok(await lives()===3&&!(await E(()=>locked))&&await E(()=>getComputedStyle(out).display)==='none',T('Restart level: 3 lives, overlay gone, board unlocked'));
  ok(await E(()=>document.querySelectorAll('.pb,.beatno').length===0&&!msg.textContent),T('Restart level clears pitch bars and fail message'));
  const after=await toks();ok(after!==before,T('dials re-randomized (differ from before restart)'));
  const solved=await E(s=>{const g=parse(LEVELS[li]);s.P.forEach(([x,y],i)=>{for(let k=0;k<s.ks[i];k++)rotate(g[y][x])});return s.P.every(([x,y])=>grid[y][x].t===g[y][x].t)},sol);ok(!solved,T('at least one dial is off the solution'));
  const seen=new Set();for(let i=0;i<8;i++){await E(()=>{lives=0;locked=true;relevel()});seen.add(await toks());
   ok(!(await E(s=>{const g=parse(LEVELS[li]);s.P.forEach(([x,y],i)=>{for(let k=0;k<s.ks[i];k++)rotate(g[y][x])});return s.P.every(([x,y])=>grid[y][x].t===g[y][x].t)},sol)),T('restart #'+(i+1)+' never pre-solved'))}
  ok(seen.size>=3,T(`restarts give varied dials (${seen.size} distinct in 8)`));
  // --- points: 250 / 200 / 150, best kept, total = sum of bests, persisted
  await E(()=>{localStorage.removeItem('res212Best');load(2)});await p.waitForTimeout(100);await winNow();
  ok(await E(()=>lastScore)===250&&/\+250/.test(await E(()=>pts.textContent)),T('first-try clear = 250, shown in win feedback'));
  await E(()=>{document.getElementById('win').style.display='none';load(2)});await p.waitForTimeout(80);[lx,ly]=await loseStart();await tap(`#c${lx}_${ly}`);await tap('#play');await idle();await p.waitForTimeout(2000);await winNow();
  ok(await E(()=>lastScore)===200,T('one life lost then clear = 200'));ok(await E(()=>bests()[2])===250,T('best kept at 250 (lower score does not overwrite)'));
  await E(()=>{document.getElementById('win').style.display='none';load(3)});await p.waitForTimeout(80);
  for(let k=0;k<2;k++){const s=await E(()=>{for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(grid[y][x]&&kind(grid[y][x])!=='rot'&&!won(simulate(grid,x,y),LEVELS[li].melody)&&!(sel&&sel.x===x&&sel.y===y))return[x,y]});
   await tap(`#c${s[0]}_${s[1]}`);await tap('#play');await idle();await p.waitForTimeout(2000)}
  await winNow();ok(await E(()=>lastScore)===150,T('two lives lost then clear = 150'));
  ok(await E(()=>score.textContent)==='★ 400',T('header total = sum of bests (250+150)'));
  // --- (b) first Play on a freshly loaded level (Next from L9 -> L10) works
  await E(()=>{document.getElementById('win').style.display='none';load(8)});await p.waitForTimeout(80);await winNow();await p.waitForTimeout(300);await tap('#next');await p.waitForTimeout(400);
  ok(await E(()=>li)===9&&await lives()===3,T('Next loads L10 with 3 lives'));
  const s10=await SOL();await tap(`#c${s10.x}_${s10.y}`);await tap('#play');await p.waitForTimeout(60);ok(await E(()=>busy)&&await E(()=>LASTPLAY.x+','+LASTPLAY.y)===s10.x+','+s10.y,T('L10: first Play click on a fresh level starts the chain'));
  await idle();await E(()=>load(9));await p.waitForTimeout(80);await tap('#play');await p.waitForTimeout(80);ok(/Tap a tile first/.test(await E(()=>msg.textContent))&&await lives()===3,T('Play with nothing selected explains instead of doing nothing (no life lost)'));
  await p.reload();await p.waitForTimeout(400);ok(await E(()=>score.textContent)==='★ 650'&&await E(()=>JSON.stringify(bests()))==='{"2":250,"3":150,"8":250}',T('best scores + total persist across reload: '+await E(()=>localStorage.res212Best)));
  ok(await lives()===3,T('lives reset to 3 on reload'));
  ok(!errs.length,T('no page errors '+errs.join(';')));await b.close()}
})();
