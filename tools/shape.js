// notes-per-beat shape of every decoy vs the tune (decoy = start/dial config that rings every tile but is not the solution)
const E=require('./levels.js');const {solve}=require('./solve.js');
const shape=m=>m.map(c=>c.length).join(',');
function shapeStats(lv){const s=solve(lv);const T=shape(lv.melody);const dec=s.cover.filter(c=>!s.match.includes(c.d));return{decoys:dec.length,same:dec.filter(c=>shape(c.melody)===T).length,match:s.match.length,cover:s.cover.length}}
module.exports={shape,shapeStats};
if(require.main===module)E.LEVELS.forEach((lv,i)=>{const r=shapeStats(lv);console.log(`L${i+1} ${lv.name}: decoys ${r.decoys}, same notes-per-beat shape ${r.same}, solutions ${r.match}`)});
