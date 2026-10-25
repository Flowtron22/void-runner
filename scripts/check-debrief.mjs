import assert from 'node:assert/strict';
import { summarizeBattle, battleReportRows, addCombatTotals } from '../js/core/BattleReport.js';
import { Game } from '../js/core/Game.js';

const battle={node:{id:'boss-test',name:'Warlord'},round:4,players:[{models:5,hp:[2,2,1]},{models:1,hp:[]}],enemies:[{models:10,hp:[]}],stats:{damageDealt:25,damageTaken:11}};
const before=structuredClone(battle);
const report=summarizeBattle(battle,true);
assert.equal(report.playerModels,6); assert.equal(report.playerModelsLost,3); assert.equal(report.survivors,3);
assert.equal(report.enemyModelsLost,10); assert.equal(report.damageDealt,25); assert.equal(report.rounds,4);
assert.deepEqual(battle,before,'report calculation must not change combat');
assert.equal(battleReportRows(report).length,6);
assert.ok(battleReportRows(null).every(([,value])=>value==='—'),'old saves must not invent statistics');
assert.deepEqual(addCombatTotals({rounds:2,enemyModelsLost:7},report),{rounds:6,enemyModelsLost:17,playerModelsLost:3,damageDealt:25,damageTaken:11});
assert.equal(JSON.parse(JSON.stringify(report)).damageTaken,11);

// Actual committed damage is counted once, including Resolve Now's pending plan.
const game=Object.create(Game.prototype);
game.battle={stats:{damageDealt:0,damageTaken:0}};
game.addLog=()=>{}; game.triggerBattleImpact=()=>{};
const plan={actorRef:{side:'player'},targetRef:{},damageLost:3,remainingHp:[2],applied:false};
game.applyDiceAttack(plan); game.applyDiceAttack(plan);
assert.equal(game.battle.stats.damageDealt,3);
game.applyDiceAttack({actorRef:{side:'enemy'},targetRef:{},damageLost:2,remainingHp:[],applied:false});
assert.equal(game.battle.stats.damageTaken,2);

// Defeat reports survive resume and do not consume a second attempt.
const ui={};
globalThis.document={querySelector:selector=>ui[selector] ||= {dataset:{},classList:{toggle(){}}}};
game.battle=null; game.run={hull:3,maxHull:3,cap:500,lastBattleReport:report};
game.save=()=>{}; let screen=null;game.show=name=>screen=name;
game.handleDefeat(battle.node);
assert.equal(game.run.hull,2); assert.equal(game.run.pendingDefeat,true); assert.equal(screen,'run-end');
game.resumeRun(); assert.equal(game.run.hull,2); assert.equal(screen,'run-end');
let retry=null; game.openLoadout=target=>retry=target;
game.handleEndButton(); assert.equal(retry,'map'); assert.equal(game.run.pendingDefeat,false);

// A repeated leaf choice cannot grant another enhancement or gear item.
game.run={protocols:[],stratagems:[],gear:[],rewardContext:{rewardVersion:2,node:{stars:1},req:26,claims:{honour:1},claimed:{honour:0},honours:['veteran-aim'],stratagems:[],wargear:[]}};
let rendered=0;game.renderRewardSegments=()=>rendered++;
game.claimPostWarChoice('honour','veteran-aim');game.claimPostWarChoice('honour','veteran-aim');
assert.deepEqual(game.run.protocols,['veteran-aim']);assert.equal(game.run.rewardContext.claimed.honour,1);assert.equal(rendered,1);
game.run.rewardContext.claims={gear:1}; game.run.rewardContext.claimed={gear:0};
game.claimPostWarChoice('gear','armour');game.claimPostWarChoice('gear','armour');
assert.equal(game.run.gear.length,1);
// Full campaign resolution keeps the established permanent-Requisition rules.
game.meta={currency:10,wins:0};
game.run={chests:10,currency:40,battles:4,bosses:1,data:200,stars:9,combatTotals:addCombatTotals({},report)};
game.endRun(true);
assert.equal(game.meta.currency,30); assert.equal(game.meta.wins,1); assert.equal(game.run,null);
assert.equal(ui['#run-end-button'].dataset.action,'home');
assert.equal(ui['#run-end-title'].textContent,'DIRECTIVE FULFILLED');
game.run={chests:10,currency:40,battles:4,bosses:1,data:200,stars:9};
game.endRun(false);
assert.equal(game.meta.currency,30); assert.equal(game.meta.wins,1);
assert.equal(ui['#run-end-title'].textContent,'DIRECTIVE FAILED');
delete globalThis.document;
console.log('Debrief: model losses, committed damage, totals, reload/retry and single reward claims passed.');
