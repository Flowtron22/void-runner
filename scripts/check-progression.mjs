import assert from 'node:assert/strict';
import fs from 'node:fs';
import {chapterProfile,migrateProgression,migrateFormation,secureSector,CHAPTER_UPGRADES} from '../js/core/Progression.js';
import {rollTacticOffer,TACTICS,rollStoreOffers} from '../js/core/RunRewards.js';
import {rankPlacementIssue} from '../js/core/DraftPlacement.js';
import {Game} from '../js/core/Game.js';

const meta={currency:90,research:{logistics:1,doctrine:2}};
migrateProgression(meta,null);migrateProgression(meta,null);
assert.equal(chapterProfile(meta,'grey-knights').currency,90);
assert.equal(chapterProfile(meta,'space-marines').currency,0);
assert.equal(chapterProfile(meta,'grey-knights').research.capacity,1);
assert.equal(CHAPTER_UPGRADES.find(u=>u.id==='capacity').cost(1),105);
const run={region:2,chests:0,securedSectors:[]};
assert.equal(secureSector(run),30);assert.equal(secureSector(run),0);
run.region=0;secureSector(run);run.region=1;secureSector(run);assert.equal(run.chests,90);

const recruits=JSON.parse(fs.readFileSync(new URL('../public/data/warhammer-roster.json',import.meta.url))).factions.flatMap(f=>f.units.map(u=>({...u,faction:f.id})));
const allRelics=rollTacticOffer([],()=>0),allNormal=rollTacticOffer([],()=>.99);
assert.equal(allRelics.length,3);assert.ok(allRelics.every(id=>TACTICS.find(t=>t.id===id).tier==='relic'));
assert.ok(allNormal.every(id=>TACTICS.find(t=>t.id===id).tier==='normal'));
assert.equal(new Set(allRelics).size,3);
assert.ok(rollStoreOffers(recruits,()=>0).every(o=>o.kind==='unit'));
assert.ok(rollStoreOffers(recruits,()=>.99).every(o=>o.kind==='gear'));

const game=Object.create(Game.prototype);game.units=recruits;game.meta=meta;
game.run={rulesVersion:2,faction:'grey-knights',protocols:[],stratagems:[],deployed:[],unlockedUnits:[],cap:1000,currency:250,gear:[],pendingPostWar:{node:{id:'shop',event:'store'},storeOffers:[{id:'gear1',kind:'gear',gearId:'armour',price:20},{id:'unit1',kind:'unit',unitId:'grey-knight-interceptors',price:80}]}};
game.save=()=>{};game.openStoreEvent=()=>{};
game.purchaseStoreItem('gear1');game.purchaseStoreItem('unit1');game.purchaseStoreItem('unit1');
assert.equal(game.run.currency,150);assert.equal(game.run.gear.length,1);assert.equal(game.run.rescuedUnits.length,1);
assert.ok(game.run.pendingPostWar);assert.ok(game.run.pendingPostWar.storeOffers.every(o=>o.sold));
game.run=JSON.parse(JSON.stringify(game.run));assert.ok(game.fieldStoreOffers().every(o=>o.sold));
assert.equal(game.unit(game.run.rescuedUnits[0].id).stock,1);

const old={deployed:[{id:'a',unitId:'x',x:0,y:0},{id:'b',unitId:'y',x:4,y:0},{id:'leader',attachedTo:'b',x:4,y:0}]};
migrateFormation(old,1000);assert.equal(old.deployed[1].rank,'rear');assert.equal(old.deployed[2].y,old.deployed[1].y);
assert.equal(old.deployed[1].y,2);migrateFormation(old,2000);assert.equal(old.deployed[1].y,3);
const unit=game.units.find(u=>u.id==='grey-knight-strike-squad');
assert.equal(rankPlacementIssue({unit,unlocked:true,deployed:[],cap:1000,used:0,x:5,y:3,rows:4}),null);
assert.match(rankPlacementIssue({unit,unlocked:true,deployed:[{unitId:'x',x:5,y:3}],cap:1000,used:0,x:5,y:3,rows:4}),/OCCUPIED/);

game.run={rulesVersion:2,faction:'grey-knights',protocols:[],stratagems:[],gear:[],deployed:[]};
chapterProfile(meta,'grey-knights').research['infantry-attacks']=1;
chapterProfile(meta,'grey-knights').research['infantry-wounds']=1;
const base=structuredClone(game.unit(unit.id));
const fighter=game.buildFighter({id:'one',unitId:unit.id,rank:'rear',x:0,y:2});
assert.equal(fighter.attacksBonus,1);assert.equal(fighter.defense.wounds,base.defense.wounds+2);
assert.deepEqual(game.unit(unit.id),base,'upgrades must not mutate source profiles');
const front={side:'player',rank:'front',dead:false,weapon:{range:0}},rear={side:'player',rank:'rear',dead:false,weapon:{range:0}};
game.battle={players:[front,rear],enemies:[]};game.addLog=()=>{};
assert.equal(game.canAttack(rear),false);front.dead=true;assert.equal(game.canAttack(rear),true);assert.equal(rear.rank,'front');
assert.equal(game.chooseTarget([{rank:'rear',currentHp:1},{rank:'front',currentHp:20}],'player').rank,'front');

game.run={rulesVersion:2,faction:'grey-knights',protocols:[],stratagems:[]};
const node={id:'preview',stars:2};const first=structuredClone(game.systemRewardPlan(node));
assert.deepEqual(game.systemRewardPlan(node),first);assert.equal(game.run.pendingNode,undefined);

// Abandoning after three cleared sectors settles exactly 90 to that chapter,
// with no conversion of the remaining temporary Requisition and no duplicate payout.
game.meta={wins:0,chapters:{}};game.run={rulesVersion:2,faction:'grey-knights',chests:90,currency:1000,battles:12,bosses:3,data:500,stars:20};
globalThis.document={querySelector:()=>({dataset:{}})};
game.show=()=>{};game.setEndArtwork=()=>{};game.renderReportStats=()=>{};
game.endRun(false);game.endRun(false);
assert.equal(chapterProfile(game.meta,'grey-knights').currency,90);
assert.equal(chapterProfile(game.meta,'space-marines').currency,0);
assert.equal(game.run,null);
// The fourth sector boss settles immediately, without generating a fifth battle.
game.run={rulesVersion:2,faction:'grey-knights',region:3,sectors:Array.from({length:4},(_,id)=>({id,status:id<3?'complete':'active'})),securedSectors:[0,1,2],chests:90,sectorStars:8,tierIndex:0,hull:3,maxHull:3,stratagems:[],battles:16,bosses:4,stars:30,data:900,currency:999};
game.advanceRoute(true,{bossTier:3});
assert.equal(game.run,null);
assert.equal(chapterProfile(game.meta,'grey-knights').currency,210,'90 retained earlier plus 120 for the complete mission');
assert.equal(chapterProfile(game.meta,'grey-knights').wins,1);
assert.equal(chapterProfile(game.meta,'space-marines').currency,0);
delete globalThis.document;
console.log('Progression: chapter isolation, migration, secured rewards, RNG tiers/shop, single stock, ranks, upgrades and fixed previews passed.');
