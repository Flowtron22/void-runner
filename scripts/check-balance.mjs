import assert from 'node:assert/strict';
import fs from 'node:fs';
import {Game} from '../js/core/Game.js';
import {capacityCost,threatCapacity,encounterDifficulty,bossReward,earlyRecovery,pacedClaims,fortificationBonus,prepareTraining} from '../js/core/Balance.js';
import {secureSector} from '../js/core/Progression.js';
const units=JSON.parse(fs.readFileSync(new URL('../public/data/warhammer-roster.json',import.meta.url))).factions.flatMap(f=>f.units.map(u=>({...u,faction:f.id})));
assert.equal(capacityCost(0),60);assert.equal(capacityCost(1),75);assert.equal(capacityCost(19),180);
assert.equal(Array.from({length:20},(_,r)=>capacityCost(r)).reduce((a,b)=>a+b),3060);
assert.equal(threatCapacity(650)-threatCapacity(500),127.5);
const profile={research:{doctrine:2,'infantry-attacks':3},currency:20};prepareTraining(profile);prepareTraining(profile);
assert.equal(profile.research['infantry-attacks'],3);assert.equal(profile.research['vehicle-attacks'],2);assert.equal(profile.currency,20);
assert.ok(threatCapacity(3500)<3500,'capacity upgrades retain a real advantage');
for(const stars of [1,2,3]) {
  const node={stars,step:1};
  for(let region=1;region<4;region++)assert.ok(encounterDifficulty(node,region)>encounterDifficulty(node,region-1));
}
assert.equal(bossReward(1),30);assert.equal(bossReward(2),35);assert.equal(bossReward(3),40);
const run={balanceVersion:1,region:0,securedSectors:[],chests:0};
assert.equal(secureSector(run,{bossTier:3}),40);assert.equal(secureSector(run,{bossTier:3}),0);
assert.equal(earlyRecovery({balanceVictories:['a','a','b','c','d']}),9);
assert.equal(earlyRecovery({...run,balanceVictories:['a','b','c']}),0,'cleared sectors never double-dip with a consolation payout');
assert.equal(earlyRecovery({balanceVictories:[]}),0);
let honours=0,tactics=0,recovery=0;
for(let region=0;region<4;region++)for(let step=0;step<4;step++) {
  const claims=pacedClaims({region,step,stars:3,type:step===3?'boss':'skirmish'});
  honours+=claims.honour;tactics+=claims.stratagem;recovery+=claims.recovery;
  assert.equal(claims.currency,1);
}
assert.equal(honours,6);assert.equal(tactics,6);assert.equal(recovery,4);
assert.equal(fortificationBonus(1,.76),1);assert.equal(fortificationBonus(1,.75),0);
assert.equal(fortificationBonus(2,.51),1);assert.equal(fortificationBonus(2,.5),0);
assert.equal(fortificationBonus(3,.01),1);assert.equal(fortificationBonus(3,1),1);

const game=Object.create(Game.prototype);game.units=units;
game.meta={chapters:{'grey-knights':{currency:0,research:{'infantry-attacks':3,'infantry-wounds':3,'infantry-toughness':3},wins:0}}};
game.run={rulesVersion:2,balanceVersion:1,faction:'grey-knights',missionCap:1100,cap:1100,protocols:[],stratagems:[],gear:[]};
const base=structuredClone(units.find(u=>u.id==='grey-knight-strike-squad'));
const fighter=game.buildFighter({id:'p',unitId:base.id,rank:'front'});
assert.equal(fighter.attacksBonus,0);assert.equal(fighter.squadAttacks,3,'permanent attacks apply once per squad, not every model');
assert.equal(fighter.maxHp,base.models*base.defense.wounds+6);
assert.equal(fighter.toughness,base.defense.toughness,'conditional +1 is resolved at wound time, not stacked +3');
game.battle={round:1,cp:{player:0,enemy:0},oathTarget:{},stratagemUsed:{}};
const target=game.buildFighter({id:'enemy',unitId:base.id},'enemy');
const attack=game.prepareDiceAttack(fighter,target);
assert.equal(attack.attacks,base.models*Number(base.weapon.attacks)+3,'the actual dice plan adds permanent attacks exactly once');
fighter.hp=[1];game.restoreWounds(fighter,99);assert.deepEqual(fighter.hp,[base.defense.wounds+6]);
fighter.hp=[1,base.defense.wounds+6];game.restoreWounds(fighter,99);assert.deepEqual(fighter.hp,[base.defense.wounds,base.defense.wounds+6]);
assert.equal(game.unit(base.id).stock,base.stock+1);
assert.deepEqual(units.find(u=>u.id===base.id),base,'stock and stat scaling must not mutate data');
// Missions already in progress keep the previous combat/claims rules.
delete game.run.balanceVersion;
const legacy=game.buildFighter({id:'old',unitId:base.id});
assert.equal(legacy.attacksBonus,3);assert.equal(legacy.maxHp,base.models*(base.defense.wounds+6));
assert.equal(game.unit(base.id).stock,base.stock);

// Settlement includes early progress once, and always stays within its chapter.
const ui={dataset:{}};globalThis.document={querySelector:()=>ui};
game.save=()=>{};game.show=()=>{};game.setEndArtwork=()=>{};game.renderReportStats=()=>{};
game.run={rulesVersion:2,balanceVersion:1,faction:'grey-knights',chests:0,balanceVictories:['a','b','c'],securedSectors:[],currency:1000};
game.endRun(false);game.endRun(false);
assert.equal(game.meta.chapters['grey-knights'].currency,9);
delete globalThis.document;
console.log('Balance: escalation, bounded grind, squad upgrades, stock growth, paced rewards, boss incentives, consolation and legacy missions passed.');
