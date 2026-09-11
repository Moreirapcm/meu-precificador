const E=require('../dist/engine.js');
function simulate(policy,seed=71){const e=E.create({seed}),s=e.state;e.start();let tick=0,lastWave=0,nextAction=0;const order=[4,7,8,9,10,11,6,0,3,1,2];const layout={4:0,7:0,8:1,9:1,10:0,11:0,6:2,0:3,3:3,1:3,2:3};
for(let it=0;it<45000&&s.mode!=='lost'&&s.mode!=='won';it++){
 if(tick>=nextAction){nextAction=tick+(policy==='active'?1.25:3);
 if(policy!=='passive'){
 if(policy==='active'){
 if(s.hp<470&&s.credits>=75)e.research('repair');
 for(let i=0;i<12;i++){const t=s.buildings[i].tower;if(t&&t.hp<t.maxHp*.7)e.repair(i)}
 const threat=s.enemies.filter(x=>!x.dead).sort((a,b)=>E.ENEMIES[b.type].attack-E.ENEMIES[a.type].attack)[0];if(threat)e.focus(threat.id);
 if(s.mode==='battle'&&s.energy>=50&&s.pulseCd===0){let best=null,n=0;for(const c of s.enemies){const nn=s.enemies.reduce((a,x)=>a+(Math.hypot(x.x-c.x,x.y-c.y)<120?1:0),0);if(nn>n){n=nn;best=c}}if(best&&(n>=5||['queen','titan','spitter'].includes(best.type)))e.pulse(best.x,best.y)}
 if(s.mode==='battle'&&s.energy>=35&&s.shieldCd===0&&(s.hazards.some(h=>!h.friendly&&h.left<1)||s.enemies.filter(x=>x.target).length>4&&s.buildings.some(b=>b.tower&&b.tower.hp<b.tower.maxHp*.45)||s.hp<250))e.shield();
 }
 const buildCount=s.buildings.filter(b=>b.tower).length;
 if(s.tier<2&&buildCount>=4&&s.wave>=2&&s.credits>=200)e.research('age');
 if(s.tier===2&&buildCount>=6&&s.wave>=6&&s.credits>=320)e.research('age');
 if(policy==='active'&&s.tier>=2&&s.wave>=4){for(const i of [10,11]){const t=s.buildings[i].tower;if(t&&t.type===0&&s.credits>=160){e.sell(i);e.build(i,3)}}}
 for(const i of order){if(!s.buildings[i].tower){let type=policy==='spam'?0:layout[i];if(policy==='active'&&s.tier>=2&&[10,11].includes(i))type=3;if(type===3&&s.tier<2)continue;if(s.credits>=E.TYPES[type].cost)e.build(i,type)}}
 for(const i of [8,9,4,7,10,11,5,6,0,3,1,2]){const t=s.buildings[i].tower;if(t&&t.level<s.tier+1&&s.credits>=e.upgradeCost(i)&&s.mode==='prep')e.upgrade(i)}
 if(s.wave>=3&&s.armor<2&&s.credits>160)e.research('armor');if(s.wave>=5&&s.damage<2&&s.credits>250)e.research('damage');
 }
 if(s.mode==='prep'&&(s.wave===0?tick>6:s.prep<5))e.nextWave();
 }
 e.step(.05);tick+=.05;
}
return {policy,seed,mode:s.mode,wave:s.wave,hp:Math.round(s.hp),credits:Math.round(s.credits),time:Math.round(tick),coreDamage:Math.round(s.metrics.coreDamage),towerDamage:Math.round(s.metrics.towerDamage),lost:s.metrics.towersLost,pulses:s.metrics.pulses,shields:s.metrics.shields,repairs:s.metrics.repairs,waves:s.metrics.waves};}
if(require.main===module){const results=[];for(const p of ['passive','spam','mixed','active'])results.push(simulate(p,71));for(const seed of [7319,42])results.push(simulate('active',seed));console.log(JSON.stringify(results,null,2));const assert=require('node:assert/strict');assert.equal(results[0].mode,'lost');assert.equal(results[1].mode,'lost');assert.equal(results[2].mode,'lost');for(const r of results.slice(3)){assert.equal(r.mode,'won');assert(r.towerDamage>0&&r.lost>0)}}module.exports=simulate;
