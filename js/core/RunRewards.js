import { STRATAGEMS, WARGEAR } from '../data/units.js';
export const RELICS=[
  {id:'relic-bastion',tier:'relic',name:'Bastion of Titan',tag:'INFANTRY WARD',desc:'Infantry gain a 5+ Invulnerable Save for this mission.',effect:{infantryInvuln:5}},
  {id:'relic-engine',tier:'relic',name:'Canticle of Iron',tag:'VEHICLE BUILD',desc:'Vehicles gain +2 attacks per model for this mission.',effect:{vehicleAttacks:2}},
  {id:'relic-brotherhood',tier:'relic',name:'Oath of the Unbroken',tag:'INFANTRY BUILD',desc:'Infantry gain +1 attack per model and +1 Toughness.',effect:{infantryAttacks:1,infantryToughness:1}},
  {id:'relic-reliquary',tier:'relic',name:'Reliquary of Recovery',tag:'ROUND RECOVERY',desc:'Surviving units restore 3 wounds after every combat round.',effect:{regen:3}},
  {id:'relic-writ',tier:'relic',name:'Writ of Acquisition',tag:'STORE BUILD',desc:'Earn 50% more Requisition from future mission victories.',effect:{requisitionBonus:.5}}
];
export const TACTICS=[...STRATAGEMS.map(s=>({...s,tier:'normal'})),...RELICS];
const pick=(list,rng)=>list[Math.floor(rng()*list.length)];
export function rollTacticOffer(owned=[],rng=Math.random,count=3) {
  const result=[];
  for(let i=0;i<count;i++) {
    const available=TACTICS.filter(t=>!owned.includes(t.id) && !result.includes(t.id));
    if(!available.length) break;
    const tier=rng()<.22?'relic':'normal';
    const pool=available.filter(t=>t.tier===tier);
    result.push(pick(pool.length?pool:available,rng).id);
  }
  return result;
}
export function rollStoreOffers(units,rng=Math.random) {
  const recruits=units.filter(u=>u.keywords.includes('Imperium'));
  const stock=[];const seen=new Set();
  for(let i=0;i<5;i++) {
    const recruit=recruits.length && rng()<.3;
    const pool=(recruit?recruits:WARGEAR).filter(item=>!seen.has(`${recruit?'unit':'gear'}-${item.id}`));
    if(!pool.length) continue;
    const item=pick(pool,rng),kind=recruit?'unit':'gear';seen.add(`${kind}-${item.id}`);
    stock.push({id:`stock-${i}-${item.id}`,kind,...(recruit?{unitId:item.id}:{gearId:item.id}),price:recruit?Math.max(50,Math.round(item.points*.6/10)*10):20+Math.floor(rng()*4)*10,sold:false});
  }
  return stock;
}
