// Verifies no ring/wave/glow effect paints outside the board's bbox mid-chain (levels 5, 7, 10).
const {chromium}=require('playwright-core');const {PNG}=require('pngjs');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const p=await b.newPage({viewport:{width:1024,height:760}});
 await p.goto('http://localhost:8765/index.html');let fail=0;
 for(const L of [4,7,9]){await p.evaluate(i=>load(i),L);await p.mouse.move(0,0);await p.waitForTimeout(300+await p.evaluate(()=>350+LEVELS[li].melody.length*180+200));   // load() auto-plays Listen (strip highlight) once audio is on: let it finish
  const box=await p.evaluate(()=>{const r=board.getBoundingClientRect();return{x:r.left,y:r.top,r:r.right,b:r.bottom}});
  const tb=await p.evaluate(()=>{const r=document.getElementById('strip').getBoundingClientRect();return{x:r.left,y:r.top,r:r.right,b:r.bottom}}); // strip no longer excluded: nothing outside the board may change
  const base=PNG.sync.read(await p.screenshot());
  const s=await p.evaluate(()=>{const P=[];grid.forEach((r,y)=>r.forEach((c,x)=>{if(c&&kind(c)==='rot')P.push([x,y])}));
   for(let m=0;m<4**P.length;m++){let mm=m;const ks=P.map(()=>{const k=mm%4;mm=Math.floor(mm/4);return k});P.forEach(([x,y],i)=>{for(let k=0;k<ks[i];k++)rotate(grid[y][x])});
    for(let y=0;y<N;y++)for(let x=0;x<N;x++)if(grid[y][x]){const r=simulate(grid,x,y);if(r.solved&&melodyEq(r.melody,LEVELS[li].melody)){render();return[x,y]}}
    P.forEach(([x,y],i)=>{for(let k=0;k<(4-ks[i])%4;k++)rotate(grid[y][x])})}});
  await p.waitForTimeout(100);const base2=PNG.sync.read(await p.screenshot());
  await p.evaluate(([x,y])=>play(x,y),s);const T0=Date.now();let worst=0,shots=0;
  const endMs=await p.evaluate(([x,y])=>{return (LEVELS[li].melody.length-1)*180},s);
  for(const t of [250,450,650,850,1050,1250,1450]){await p.waitForTimeout(150);if(Date.now()-T0>endMs+100)break;/* stop before the win flash at endMs+500 */shots++;const img=PNG.sync.read(await p.screenshot({path:`tools/shots/fx_L${L+1}_${t}.png`}));let n=0;
   for(let y=0;y<img.height;y++)for(let x=0;x<img.width;x++){if(x>=box.x-1&&x<=box.r+1&&y>=box.y-1&&y<=box.b+1)continue;const i=(y*img.width+x)*4;
    if(Math.abs(img.data[i]-base2.data[i])+Math.abs(img.data[i+1]-base2.data[i+1])+Math.abs(img.data[i+2]-base2.data[i+2])>12){n++;if(n==1&&process.env.DBG)console.log("  first px",x,y)}}
   if(n>worst)worst=n}
  console.log((worst?'FAIL':'PASS')+` L${L+1}: changed pixels outside board bbox mid-chain = ${worst} (${shots} screenshots over ${endMs}ms chain)`);if(worst)fail=1;
  await p.waitForFunction(()=>!busy||document.getElementById('win').style.display==='flex',null,{timeout:15000});await p.evaluate(()=>{document.getElementById('win').style.display='none'})}
 process.exitCode=fail;await b.close()})();
