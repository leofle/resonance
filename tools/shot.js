// quick screenshots: node tools/shot.js <levelIndex> [tapAfterMs]
const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const p=await b.newPage({viewport:{width:1024,height:820}});
 await p.goto('http://localhost:8765/index.html');for(const L of process.argv.slice(2).map(Number)){await p.evaluate(i=>load(i),L);await p.waitForTimeout(200);await p.screenshot({path:`tools/shots/v2_L${L+1}.png`});
 console.log(L+1,await p.evaluate(()=>JSON.stringify(board.getBoundingClientRect())))}await b.close()})();
