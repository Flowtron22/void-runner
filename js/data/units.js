export const BATTLE_HONOURS = [
  {id:'veteran-aim',name:'Veteran Aim',tag:'HIT ROLLS',desc:'Add 1 to hit rolls. A natural 1 still fails.',effect:{hitBonus:1}},
  {id:'tank-hunters',name:'Tank Hunters',tag:'WOUND ROLLS',desc:'Add 1 to wound rolls. A natural 1 still fails.',effect:{woundBonus:1}},
  {id:'reinforced',name:'Reinforced Armour',tag:'DEFENCE',desc:'Improve every unit’s Save by 1.',effect:{saveBonus:1}},
  {id:'field-medics',name:'Field Medics',tag:'RECOVERY',desc:'Every surviving unit recovers 2 wounds after each battle round.',effect:{regen:2}},
  {id:'lethal-drill',name:'Lethal Drill',tag:'CRITICAL HITS',desc:'Unmodified hit rolls of 6 automatically wound.',effect:{lethalHits:true}},
  {id:'sustained-fire',name:'Sustained Fire',tag:'CRITICAL HITS',desc:'Unmodified hit rolls of 6 generate one additional hit.',effect:{sustainedHits:1}},
  {id:'combat-shields',name:'Combat Shields',tag:'INVULNERABLE',desc:'Units without an Invulnerable Save gain a 6+ Invulnerable Save.',effect:{invuln:6}},
  {id:'feel-no-pain',name:'Refuse to Fall',tag:'DAMAGE',desc:'Ignore each lost wound on a D6 roll of 6.',effect:{fnp:6}},
  {id:'rapid-muster',name:'Rapid Muster',tag:'ARMY POINTS',desc:'Increase the army limit by 100 points for this campaign.',effect:{pointBonus:100}}
];

export const WARGEAR = [
  {id:'targeter',name:'Targeting Array',desc:'Improve this unit’s hit roll by 1.',stat:'hitBonus',value:1},
  {id:'armour',name:'Artificer Armour',desc:'Improve this unit’s Save by 1.',stat:'saveBonus',value:1},
  {id:'adamantine',name:'Adamantine Bracing',desc:'Add 2 to this unit’s Toughness.',stat:'toughness',value:2},
  {id:'ammo',name:'Master-crafted Ammunition',desc:'Add 1 Attack per model.',stat:'attacksBonus',value:1},
  {id:'shield',name:'Conversion Field',desc:'Grant this unit a 5+ Invulnerable Save.',stat:'invuln',value:5}
];

export const REGIONS = [
  {name:'OUTER WARZONE',cap:500,boss:'ENEMY WARLORD',tone:'#42f5d7'},
  {name:'CONTESTED SECTOR',cap:1000,boss:'ARMOURED SPEARHEAD',tone:'#9b6dff'},
  {name:'FORTRESS LINE',cap:1500,boss:'TITANIC ASSAULT',tone:'#ffd166'},
  {name:'FINAL CRUSADE',cap:2000,boss:'SUPREME COMMAND',tone:'#ff496c'}
];

export const RESEARCH = [
  {id:'logistics',name:'Expanded Supply',icon:'▦',max:3,costs:[60,140,260],desc:'Start every campaign with +50 Army Points per rank.'},
  {id:'doctrine',name:'Veteran Training',icon:'▲',max:3,costs:[80,180,320],desc:'Rank 1 improves Hit rolls, Rank 2 improves Wound rolls, and Rank 3 grants Feel No Pain 6+.'},
  {id:'salvage',name:'Requisition Rights',icon:'◆',max:3,costs:[70,160,300],desc:'Earn 15% more Requisition per rank.'},
  {id:'insurance',name:'Campaign Reserve',icon:'✚',max:2,costs:[100,240],desc:'Gain one additional campaign attempt per rank.'}
];
