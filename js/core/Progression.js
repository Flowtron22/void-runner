export const CHAPTER_UPGRADES=[
  {id:'capacity',name:'Expanded Muster',icon:'▦',max:20,desc:'+150 army points per rank.',cost:rank=>60+rank*45},
  ...['infantry','vehicle'].flatMap(type=>[
    {id:`${type}-attacks`,name:`${type==='infantry'?'Infantry':'Vehicle'} Fire Discipline`,icon:'⚔',max:3,desc:`+1 attack per ${type} model per rank.`,cost:r=>90+r*90},
    {id:`${type}-toughness`,name:`${type==='infantry'?'Infantry':'Vehicle'} Fortification`,icon:'▲',max:3,desc:`+1 Toughness to ${type} per rank.`,cost:r=>120+r*120},
    {id:`${type}-wounds`,name:`${type==='infantry'?'Infantry':'Vehicle'} Endurance`,icon:'✚',max:3,desc:`+2 wounds per ${type} model per rank.`,cost:r=>100+r*110}
  ]),
  {id:'salvage',name:'Requisition Rights',icon:'◆',max:3,desc:'+15% mission Requisition per rank.',cost:r=>70+r*90},
  {id:'insurance',name:'Campaign Reserve',icon:'♥',max:2,desc:'+1 mission attempt per rank.',cost:r=>100+r*140}
];
export function chapterProfile(meta,faction='grey-knights') {
  meta.chapters ||= {};
  return meta.chapters[faction] ||= {currency:0,research:{},wins:0};
}
export function migrateProgression(meta,run,legacyCap=500) {
  if(meta.progressionVersion!==2) {
    const profile=chapterProfile(meta,run?.faction || 'grey-knights');
    profile.currency+=meta.currency || 0;
    profile.research={...meta.research,...profile.research};
    profile.research.capacity=Math.max(profile.research.capacity || 0,profile.research.logistics || 0);
    meta.currency=0;meta.research={};meta.progressionVersion=2;
  }
  if(run && run.rulesVersion!==2) {
    run.rulesVersion=2;run.capacityFloor=legacyCap;run.missionCap=Math.max(legacyCap,run.cap || 500);
    if((run.region ?? 0)<4) run.sectors=run.sectors.slice(0,4);
    run.securedSectors=run.sectors.filter(s=>s.status==='complete').map(s=>s.id);
    run.chests=Math.max(run.chests || 0,run.securedSectors.length*30);
  }
}
export function formationRows(cap) { return cap>1800?6:4; }
export function migrateFormation(run,cap) {
  const rows=formationRows(cap);
  if(run.formationVersion===2 && run.formationRows===rows) return;
  const half=formationRows(cap)/2,counts={front:0,rear:0};
  const original=new Map(run.deployed.map(p=>[p.id,{...p}]));
  for(const placed of run.deployed.filter(p=>!p.attachedTo)) {
    const rank=placed.rank || (placed.x<3?'front':'rear');const index=counts[rank]++;
    placed.x=index%6;placed.y=Math.floor(index/6)+(rank==='rear'?half:0);placed.rank=rank;placed.rotated=false;
  }
  for(const placed of run.deployed.filter(p=>p.attachedTo)) {
    const parent=run.deployed.find(p=>p.id===placed.attachedTo);
    if(parent) Object.assign(placed,{x:parent.x,y:parent.y,rank:parent.rank,rotated:false});
    else {const old=original.get(placed.id);Object.assign(placed,{x:old.x%6,y:half,rank:'rear',attachedTo:null,rotated:false});}
  }
  run.formationVersion=2;
  run.formationRows=rows;
}
export function secureSector(run) {
  run.securedSectors ||= [];
  if(run.securedSectors.includes(run.region)) return 0;
  run.securedSectors.push(run.region);run.chests=(run.chests || 0)+30;return 30;
}
