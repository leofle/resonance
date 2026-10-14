const {chromium}=require('playwright-core');
(async()=>{const b=await chromium.launch({executablePath:'/usr/bin/google-chrome'});const p=await b.newPage();await p.goto('http://localhost:8765/index.html');
await p.evaluate(()=>load(7));await p.screenshot({path:'/tmp/l8.png'});console.log(await p.evaluate(()=>[innerHeight,B.style.getPropertyValue('--s'),JSON.stringify(document.getElementById('c0_0').getBoundingClientRect()),JSON.stringify(document.getElementById('c0_1').getBoundingClientRect())]));await b.close()})();
