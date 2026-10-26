// Repeatable headless sampling of the real combat engine, not a substitute for playtesting.
import fs from 'node:fs';
import {Game} from '../js/core/Game.js';
import {encounterDifficulty} from '../js/core/Balance.js';
import {rollTacticOffer} from '../js/core/RunRewards.js';
import {BATTLE_HONOURS} from '../js/data/units.js';
const roster=JSON.parse(fs.readFileSync(new URL('../public/data/warhammer-roster.json',import.meta.url)));
const units=roster.factions.flatMap(f=>f.units.map(u=>({...u,faction:f.id})));
const patterns=['grey-knight-strike-squad','grey-knight-terminators','grey-knight-interceptors','grey-knight-paladins','grey-knight-purgation','grey-knight-purifiers'];
let seed=1;const random=Math.random;
const rng=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
function gameFor(cap,rank,sector,boss=false) {
  const game=Object.create(Game.prototype);game.units=units;game.factions=roster.factions;
  game.meta={chapters:{'grey-knights':{currency:0,research:{capacity:(cap-500)/150,'infantry-attacks':rank,'infantry-wounds':rank,'infantry-toughness':rank},wins:0}}};
  game.run={rulesVersion:2,balanceVersion:1,faction:'grey-knights',cap,missionCap:cap,region:sector,gear:[],protocols:[],stratagems:[],deployed:[]};
  // Representative accumulated powers, without assuming every optimal reward is acquired.
  const honoursCount=boss?(sector===0?1:6):0,tacticsCount=boss?(sector===0?1:5):0;
  for(let i=0;i<Math.max(honoursCount,tacticsCount);i++) {
    const honours=BATTLE_HONOURS.filter(h=>!game.run.protocols.includes(h.id));
    if(i<honoursCount && honours.length)game.run.protocols.push(honours[Math.floor(rng()*honours.length)].id);
    const tactics=rollTacticOffer(game.run.stratagems,rng);
    if(i<tacticsCount && tactics.length)game.run.stratagems.push(tactics[0]);
  }
  const pool=patterns.map(id=>game.unit(id)).filter(Boolean).sort(()=>rng()-.5);
  const draftCap=cap+(game.run.protocols.includes('rapid-muster')?100:0);
  // Bounded knapsack fills legal stock close to capacity; mix varies across samples.
  const dp=new Map([[0,[]]]);
  for(const u of pool)for(let n=0;n<u.stock;n++)for(const [pts,list] of [...dp].sort((a,b)=>b[0]-a[0])) {
    const next=pts+u.points;if(next<=draftCap && !dp.has(next))dp.set(next,[...list,u.id]);
  }
  const chosen=dp.get(Math.max(...dp.keys()));
  game.run.deployed=chosen.map((unitId,i)=>({unitId,id:'p'+i,x:i%6,y:i%2?2:0,rank:i%2?'rear':'front'}));
  game.addLog=()=>{};game.triggerBattleImpact=()=>{};
  game.finishBattle=win=>{game.result=win;game.battle.resolving=true;};
  return game;
}
function fight(game,node) {
  game.battle={node,players:game.run.deployed.map(p=>game.buildFighter(p)),enemies:game.makeEnemyForce(node),round:0,resolving:false,
    cp:{player:1,enemy:1},insaneBravery:{player:false,enemy:false},stratagemUsed:{player:false,enemy:false},oathTarget:{player:null,enemy:null},shadowUsed:{player:false,enemy:false},stats:{damageDealt:0,damageTaken:0}};
  while(!game.battle.resolving && game.battle.round<30)game.runRound(false);
  return game.result;
}
const trials=Number(process.argv[2] || 120),rows=[];
try {
  Math.random=rng;
  for(const [label,cap,rank] of [['fresh',500,0],['developing',1100,1],['veteran',2000,3],['max-capacity',3500,3]])for(const [sector,boss] of [[0,false],[0,true],[3,true]])for(const stars of (boss?[1,2,3]:[1,3])) {
    let wins=0,rounds=0;const byFaction={};
    for(let i=0;i<trials;i++) {
      seed=12345+i*9173+sector*701+stars*53;
      const game=gameFor(cap,rank,sector,boss),enemy=roster.factions.filter(f=>f.id!=='grey-knights')[i%(roster.factions.length-1)];
      const node={type:boss?'boss':'skirmish',stars,bossTier:stars,step:boss?3:0,enemyFaction:enemy.id};node.difficulty=encounterDifficulty(node,sector);
      const won=fight(game,node);wins+=Number(won);rounds+=game.battle.round;
      const f=byFaction[enemy.id] ||= {wins:0,total:0};f.wins+=Number(won);f.total++;
    }
    rows.push({army:label,sector:sector+1,encounter:(boss?'boss ':'opening ')+stars+'★',winRate:Math.round(wins/trials*100)+'%',rounds:Math.round(rounds/trials*10)/10});
  }
} finally {Math.random=random;}
console.table(rows);
