const assert=require('node:assert/strict');
const E=require('../dist/engine.js');
const run=(g,s,step=.05)=>{for(let i=0;i<s/step;i++)g.step(step)};
function isolated(){const e=E.create({seed:11,testing:true});e.start();const s=e.state;s.mode='battle';s.wave=1;s.queue=[];s.spawnClock=999;s.buildings.forEach(b=>b.tower=null);return e}
{
 const e=isolated(),s=e.state;const attacker=e.spawnForTest('scout',0,500,596);attacker.next=6;run(e,2);assert(s.hp<600);assert(!attacker.dead,'Enemy must keep attacking the core');assert(s.metrics.coreDamage>0);console.log('Core receives repeated attacks without consuming enemy: OK');
}
{
 const e=isolated(),s=e.state;s.credits=1000;e.build(4,0);s.buildings[4].tower.build=0;s.buildings[4].tower.cd=999;for(let i=0;i<8;i++)e.spawnForTest('scout',0,280+i,310);run(e,8);assert.equal(s.buildings[4].tower,null);assert.equal(s.metrics.towersLost,1);console.log('Towers take damage and are destroyed: OK');
}
{
 const e=isolated(),s=e.state;s.credits=1000;e.build(4,0);s.buildings[4].tower.build=0;s.buildings[4].tower.cd=999;const t=s.buildings[4].tower;e.damageTowerForTest(4,t.id,40);const hp=t.hp;e.repair(4);run(e,1);assert(t.hp>hp&&t.hp<t.maxHp);s.paused=true;const frozen=t.hp;run(e,2);assert.equal(t.hp,frozen);s.paused=false;run(e,6);assert.equal(t.hp,t.maxHp);console.log('Repair is gradual; pause freezes repair and simulation: OK');
}
{
 const e=isolated(),s=e.state;s.credits=1000;e.build(4,0);const old=s.buildings[4].tower;e.damageTowerForTest(4,old.id,1000);e.build(4,0);const rebuilt=s.buildings[4].tower;e.damageTowerForTest(4,old.id,1000);assert.equal(rebuilt.hp,rebuilt.maxHp);console.log('Projectiles cannot damage a replacement structure with a stale target: OK');
}
{
 const e=isolated();const armored=e.spawnForTest('brute',0,100,100);let h=armored.hp;e.hurtForTest(armored,20,0);const lightDamage=h-armored.hp;h=armored.hp;e.hurtForTest(armored,20,3);assert(h-armored.hp>lightDamage);const s=e.state;s.energy=100;const far=e.spawnForTest('scout',0,900,100),farHp=far.hp;assert(e.pulse(100,100).ok);assert.equal(s.energy,50);assert(!e.pulse(100,100).ok);run(e,.9);assert.equal(far.hp,farHp);console.log('Armor, plasma penetration, local orbital radius and energy cost: OK');
}
{
 const e=isolated(),s=e.state;s.energy=100;e.shield();e.spawnForTest('scout',0,500,596).next=6;run(e,1.2);assert(s.metrics.coreDamage>0&&s.metrics.coreDamage<8);console.log('Shield reduces actual core damage: OK');
}
{
 const e=isolated(),s=e.state;s.credits=1000;e.build(4,1);const t=s.buildings[4].tower;t.build=0;const fly=e.spawnForTest('flyer',0,275,280),hp=fly.hp;run(e,1);assert.equal(fly.hp,hp);console.log('Artillery cannot hit flying invaders: OK');
}
{
 const e=E.create();e.start();const s=e.state;s.credits=500;assert(e.research('age').ok);assert(!e.build(1,3).ok);run(e,10.1);assert.equal(s.tier,2);assert(e.build(1,3).ok);console.log('Technology takes time and gates advanced defenses: OK');
}
{
 const e=E.create();e.start();const s=e.state;s.mode='prep';s.wave=1;s.prep=1;run(e,1.2);assert.equal(s.wave,2);assert.equal(s.mode,'battle');console.log('Timed preparation starts the next wave: OK');
}
{
 const e=isolated(),s=e.state;s.wave=12;const q=e.spawnForTest('queen',2,500,150);q.hp=q.max*.49;run(e,.1);assert(q.enraged);assert.equal(s.enemies.filter(x=>x.type==='runner').length,4);run(e,10.2);assert(s.hazards.some(h=>!h.friendly&&h.left>0));console.log('Boss enrages, reinforces and telegraphs its bombardment: OK');
}
{
 const e=isolated(),s=e.state;s.hp=1;e.spawnForTest('scout',0,500,596).next=6;run(e,2);assert.equal(s.mode,'lost');const v=E.create({testing:true});v.start();v.state.mode='battle';v.state.wave=12;v.state.queue=[];v.state.spawnClock=999;v.step(.05);assert.equal(v.state.mode,'won');console.log('Victory and defeat terminal states: OK');
}
