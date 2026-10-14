// Layout on phones + desktop: strip edges == board edges (±1px), no horizontal page overflow, Listen in the controls
// row, strip track follows the playing beat on the longest level and returns to the start when idle; drag scrolls.
const pw=require('playwright-core');const ok=(c,m)=>{console.log((c?'PASS ':'FAIL ')+m);if(!c)process.exitCode=1};
(async()=>{for(const [name,lo] of [['chromium',{executablePath:'/usr/bin/google-chrome'}],['webkit',{}]]){const b=await pw[name].launch(lo);
 for(const w of [320,375,390,430,1280]){const mob=w<1000;const c=await b.newContext({viewport:{width:w,height:mob?844:900},hasTouch:mob,isMobile:mob&&name==='chromium'});
  const p=await c.newPage();await p.goto('http://localhost:8765/index.html');
  for(let L=0;L<10;L++){await p.evaluate(i=>load(i),L);await p.waitForTimeout(30);
   const r=await p.evaluate(()=>{const s=document.getElementById('strip').getBoundingClientRect(),bd=board.getBoundingClientRect(),bar=document.getElementById('bar');
    return{dl:Math.abs(s.left-bd.left),dr:Math.abs(s.right-bd.right),sw:document.documentElement.scrollWidth,iw:innerWidth,bsw:document.body.scrollWidth,
     listenInBar:document.getElementById('listen').parentElement===bar,barOK:[...bar.children].every(e=>{const q=e.getBoundingClientRect();return q.left>=0&&q.right<=innerWidth})}});
   if(L===5||!r.listenInBar||r.dl>1||r.dr>1||r.sw!==r.iw||!r.barOK||r.bsw>r.iw)ok(r.dl<=1&&r.dr<=1&&r.sw===r.iw&&r.bsw<=r.iw&&r.listenInBar&&r.barOK,`${name} ${w}px L${L+1}: strip edges = board (Δ${r.dl.toFixed(2)}/${r.dr.toFixed(2)}), scrollWidth ${r.sw}=${r.iw}, Listen in controls row, controls on screen`)}
  ok(true,`${name} ${w}px: all 10 levels checked`);
  // longest level: track follows playback
  const longest=await p.evaluate(()=>{let bi=0,bw=0;LEVELS.forEach((l,i)=>{load(i);const m=TR.scrollWidth-S.clientWidth;if(m>bw){bw=m;bi=i}});load(bi);return{bi,m:bw}});
  if(longest.m>0){await p.click('#listen');const xs=[];for(let k=0;k<12;k++){await p.waitForTimeout(150);xs.push(await p.evaluate(()=>trackX))}
   ok(Math.max(...xs)>0&&xs.some((x,i)=>i&&x>xs[i-1]),`${name} ${w}px L${longest.bi+1}: track moves during Listen (max ${Math.max(...xs).toFixed(0)}px of ${longest.m}px)`);
   const vis=await p.evaluate(()=>{const h=document.querySelector('#strip .col.hl');if(!h)return true;const a=h.getBoundingClientRect(),s=S.getBoundingClientRect();return a.left>=s.left-1&&a.right<=s.right+1});ok(vis,`${name} ${w}px: highlighted beat is inside the strip viewport`);
   await p.waitForTimeout(2200);ok(await p.evaluate(()=>trackX===0&&S.classList.contains('more-r')&&!S.classList.contains('more-l')),`${name} ${w}px: idle strip shows the start with a right edge fade`);
   const sb=await (await p.$('#strip')).boundingBox();await p.mouse.move(sb.x+sb.width-20,sb.y+sb.height/2);await p.mouse.down();await p.mouse.move(sb.x+20,sb.y+sb.height/2,{steps:6});await p.mouse.up();
   ok(await p.evaluate(()=>trackX>0),`${name} ${w}px: dragging the strip scrolls it`);
   // chain also follows
   await p.evaluate(()=>{load(li);let s=null;for(let y=0;y<N&&!s;y++)for(let x=0;x<N&&!s;x++)if(grid[y][x]&&kind(grid[y][x])!=='rot'){const r=simulate(grid,x,y);if(r.melody.length>=LEVELS[li].melody.length)s=[x,y]}if(s)play(...s)});
   let mx=0;for(let k=0;k<10;k++){await p.waitForTimeout(150);mx=Math.max(mx,await p.evaluate(()=>trackX))}ok(mx>0,`${name} ${w}px: track follows a chain too`)}
  else ok(await p.evaluate(()=>!S.classList.contains('more-r')),`${name} ${w}px: all beats fit, no scrolling/fade`);
  if(name==='webkit'&&w===390){await p.evaluate(()=>{load(5)});await p.waitForTimeout(300);await p.screenshot({path:'/workspace/resonance_l6_mobile.png'})}
  await c.close()}
 await b.close()}})();
