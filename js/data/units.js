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

export const CAMPAIGN_TIERS = [
  {points:500, name:'COMBAT PATROL', sectors:4, depth:3, enemyScale:1, permanentReward:30},
  {points:1000, name:'INCURSION', sectors:5, depth:4, enemyScale:1.08, permanentReward:45},
  {points:1500, name:'BATTLE HOST', sectors:6, depth:4, enemyScale:1.16, permanentReward:60},
  {points:2000, name:'STRIKE FORCE', sectors:7, depth:5, enemyScale:1.24, permanentReward:80},
  {points:3000, name:'ONSLAUGHT', sectors:8, depth:6, enemyScale:1.34, permanentReward:110}
];

export const SECTOR_NAMES = [
  'CALIXIS','SCARUS','GOTHIC','NEPHILIM',
  'UHLIS','SOMNIUM STARS','MAZYNTH BREACH','EASTERN FRINGE'
];

export const STRATAGEMS = [
  {id:'command-relay',name:'Command Relay',tag:'START +1 CP',desc:'Begin every battle with one additional Command Point.',effect:{startingCp:1}},
  {id:'orbital-mark',name:'Orbital Mark',tag:'FIRST SALVO',desc:'Every unit gains one additional attack per model during the first battle round.',effect:{openingAttacks:1}},
  {id:'reserve-wave',name:'Reserve Wave',tag:'RECOVER',desc:'Recover one campaign attempt when the current sector boss falls.',effect:{bossRepair:1}},
  {id:'auspex-grid',name:'Auspex Grid',tag:'TARGET LOCK',desc:'Hit rolls of 5+ automatically wound during the first battle round.',effect:{openingAutoWound:5}},
  {id:'field-cache',name:'Field Cache',tag:'+20 REQ',desc:'Gain 20 campaign Requisition immediately.',effect:{currency:20}},
  {id:'armour-doctrine',name:'Aegis Protocol',tag:'ROUND 1 WARD',desc:'Grant every unit a 5+ Invulnerable Save during the first battle round.',effect:{openingInvuln:5}}
];

export const RESEARCH = [
  {id:'logistics',name:'Expanded Supply',icon:'▦',max:3,costs:[60,140,260],desc:'Start every campaign with +50 Army Points per rank.'},
  {id:'doctrine',name:'Veteran Training',icon:'▲',max:3,costs:[80,180,320],desc:'Rank 1 improves Hit rolls, Rank 2 improves Wound rolls, and Rank 3 grants Feel No Pain 6+.'},
  {id:'salvage',name:'Requisition Rights',icon:'◆',max:3,costs:[70,160,300],desc:'Earn 15% more Requisition per rank.'},
  {id:'insurance',name:'Campaign Reserve',icon:'✚',max:2,costs:[100,240],desc:'Gain one additional campaign attempt per rank.'}
];
