// loads final.json into engine LEVELS (node)
const E=require('../engine.js');const F=require('../final.json');E.LEVELS.splice(0,E.LEVELS.length,...F);module.exports=E;
