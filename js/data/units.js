export const UNITS = [
  {id:'needle',name:'Needle Team',mark:'N',role:'Striker',cost:100,size:[1,1],hp:44,damage:12,speed:5,color:'#42f5d7',unlock:0,stock:3,desc:'Fast skirmishers. Bonus damage from the front.'},
  {id:'bastion',name:'Bastion Cohort',mark:'B',role:'Guard',cost:160,size:[1,2],hp:112,damage:7,armor:3,speed:2,color:'#78f08b',unlock:0,stock:2,desc:'Tall armored screen that draws hostile fire.'},
  {id:'chirurgeon',name:'Chirurgeon',mark:'C',role:'Support',cost:140,size:[1,1],hp:52,damage:4,heal:12,speed:3,color:'#ffd166',unlock:0,stock:2,desc:'Repairs the most damaged ally every round.'},
  {id:'hexgun',name:'Hexgun Battery',mark:'H',role:'Artillery',cost:210,size:[2,1],hp:62,damage:22,speed:1,color:'#9b6dff',unlock:0,stock:2,desc:'Heavy backline fire. Fragile if exposed.'},
  {id:'rammer',name:'Rammer Lance',mark:'R',role:'Breaker',cost:280,size:[2,1],hp:130,damage:25,armor:2,speed:4,color:'#ff8d66',unlock:1,stock:2,desc:'Unlocked in Region 2. Crushes armored targets.'},
  {id:'bulwark',name:'Bulwark Engine',mark:'W',role:'Heavy',cost:420,size:[2,2],hp:240,damage:24,armor:5,speed:1,color:'#65b9ff',unlock:2,stock:1,desc:'Unlocked in Region 3. A mobile fortress.'},
  {id:'colossus',name:'Null Colossus',mark:'Ø',role:'Titan',cost:500,size:[3,2],hp:360,damage:42,armor:7,speed:1,color:'#ff496c',unlock:3,stock:1,desc:'Unlocked in Region 4. One unit, half an army.'}
];

export const PROTOCOLS = [
  {id:'redline',name:'Redline Doctrine',tag:'OFFENSE',desc:'All units deal 18% more damage.',effect:{damage:1.18}},
  {id:'ablative',name:'Ablative Weave',tag:'DEFENSE',desc:'All units enter battle with 20% more health.',effect:{health:1.2}},
  {id:'fieldrepair',name:'Field Repair Swarm',tag:'SUSTAIN',desc:'Every surviving unit repairs 4 health each round.',effect:{regen:4}},
  {id:'triage',name:'Triage Override',tag:'SUPPORT',desc:'Support healing is increased by 70%.',effect:{healing:1.7}},
  {id:'killchain',name:'Kill-Chain Relay',tag:'TEMPO',desc:'The first enemy destroyed grants +35% damage next round.',effect:{killchain:1}},
  {id:'targeting',name:'Targeting Lattice',tag:'PRECISION',desc:'Artillery attacks deal 35% more damage.',effect:{artillery:1.35}},
  {id:'cohesion',name:'Cohesion Field',tag:'FORMATION',desc:'Units with an adjacent ally gain 2 armor.',effect:{adjacentArmor:2}},
  {id:'lastlight',name:'Last-Light Vow',tag:'FAILSAFE',desc:'The first lethal hit each battle leaves that unit at 1 health.',effect:{lastStand:1}},
  {id:'vanguard',name:'Vanguard Signal',tag:'THREAT',desc:'Guards gain 35 health and draw more attacks.',effect:{guardHp:35}},
  {id:'volley',name:'Opening Volley',tag:'AMBUSH',desc:'Artillery fires once before round one.',effect:{opening:1}}
];

export const GEAR = [
  {id:'hardened_plate',name:'Hardened Plate',desc:'+28 maximum health.',stat:'hp',value:28},
  {id:'phase_scope',name:'Phase Scope',desc:'+7 attack damage.',stat:'damage',value:7},
  {id:'reactive_mesh',name:'Reactive Mesh',desc:'+2 armor.',stat:'armor',value:2},
  {id:'repair_spindle',name:'Repair Spindle',desc:'+6 healing; non-supports gain minor repair.',stat:'heal',value:6},
  {id:'quick_core',name:'Quick Core',desc:'+2 initiative.',stat:'speed',value:2}
];

export const REGIONS = [
  {name:'ASHEN APPROACH',cap:500,boss:'THE CINDER WARDEN',tone:'#42f5d7'},
  {name:'GLASS TRENCH',cap:900,boss:'MIRROR ARTILLERY',tone:'#9b6dff'},
  {name:'IRON PILGRIMAGE',cap:1400,boss:'THE PROCESSION',tone:'#ffd166'},
  {name:'NULL CITADEL',cap:2000,boss:'CROWN OF STATIC',tone:'#ff496c'}
];

export const RESEARCH = [
  {id:'logistics',name:'Expanded Mandate',icon:'▦',max:3,costs:[60,140,260],desc:'Start each expedition with +50 command points per rank.'},
  {id:'doctrine',name:'Veteran Doctrine',icon:'▲',max:3,costs:[80,180,320],desc:'All deployed units gain +5% damage per rank.'},
  {id:'salvage',name:'Salvage Rights',icon:'◆',max:3,costs:[70,160,300],desc:'Earn 15% more War Chests per rank.'},
  {id:'insurance',name:'Hull Insurance',icon:'✚',max:2,costs:[100,240],desc:'Gain one additional campaign hull per rank.'}
];
