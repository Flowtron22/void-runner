// Import a locally downloaded Wahapedia datasheets snapshot; never run at runtime.
import fs from 'node:fs';
const html = fs.readFileSync(process.argv[2], 'utf8');
const file = new URL('../public/data/warhammer-roster.json', import.meta.url);
const roster = JSON.parse(fs.readFileSync(file, 'utf8'));
const faction = roster.factions.find(f => f.id === 'grey-knights');
// Short reference summaries; these do not add new combat-engine effects.
const summaries={
  'Strike-Squad':'Sanctifying Ritual: secured objectives remain yours until enemy control exceeds yours.',
  'Brotherhood-Terminator-Squad':'Force Edge: melee attacks gain 1 AP against targets other than Monsters and Vehicles.',
  'Nemesis-Dreadknight':'Indomitable Spirit: may shoot and charge after advancing or falling back.',
  'Brotherhood-Librarian':'Sanctic Hood: the led squad ignores Psychic wounds on 4+. Haloed in Soulfire: enemies must be within 18 inches to shoot the led squad.',
  'Interceptor-Squad':'Personal Teleporters: after shooting, an unengaged squad may move up to 6 inches, giving up its charge that turn.',
  'Paladin-Squad':'Attuned Onslaught: charging Paladins gain 1 melee damage for that turn.',
  'Purgation-Squad':'Righteous Persecution: shooting can pin one hit target other than Monsters and Vehicles, reducing movement and charge distance by 2 until your next turn.',
  'Purifier-Squad':'Sanctity of Purpose: reroll wound results of 1, or all failed wounds against enemies near an objective.',
  'Castellan-Crowe':'Champion of the Order of Purifiers: grants the led squad an extra Purifying Flame attack per model. Foresight: reroll hits when attacking Characters.',
  'Grand-Master-Voldus':'Sanctuary: the squad gains Stealth and enemies suffer −1 to hit it in melee. Hammer Aflame: a fight-phase roll inflicts mortal wounds on an engaged enemy.',
  'Brotherhood-Champion':'Clarion of Haste: the led squad can charge after advancing. Inspiring Exemplar: defeating a Character in melee awards CP and improves the Champion’s attacks.',
  'Brotherhood-Chaplain':'Zealous Path: the led squad rerolls charges. Litanies of Sanctity: once per battle, removes Battle-shock from a nearby Grey Knights squad.',
  'Brotherhood-Techmarine':'Techmarine: gains Lone Operative near friendly vehicles. Blessing of the Omnissiah: repairs a nearby vehicle and improves its hits. Guardians of the Machine: discounts a qualifying Heroic Intervention.',
  'Brother-captain':'Hammerhand: grants Lethal Hits to the led squad’s melee weapons. Eye of Judgement: rerolls this model’s wounds.',
  'Venerable-Dreadnought':'Guidance of the Ancients: a target hit by this model’s shooting becomes easier for other Grey Knights to hit for the rest of that phase.',
  'Kaldor-Draigo':'Untouchable Purity: the led squad ignores mortal wounds on 4+. One With the Warp: once per battle, gains 3 to a charge after arriving by teleport. Supreme Commander: must be the Warlord when included.'
};
const clean = s => s.replace(/<[^>]*>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&#39;/g, "'").replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const entries = [
  ['Strike-Squad','grey-knight-strike-squad'],
  ['Brotherhood-Terminator-Squad','grey-knight-terminators'],
  ['Nemesis-Dreadknight','nemesis-dreadknight'],
  ['Brotherhood-Librarian','brotherhood-librarian'],
  ['Interceptor-Squad','grey-knight-interceptors','Storm bolter',[2,2],true],
  ['Paladin-Squad','grey-knight-paladins','Nemesis force weapon',[3,2],true],
  ['Purgation-Squad','grey-knight-purgation','Psycannon',[2,2],true],
  ['Purifier-Squad','grey-knight-purifiers','Purifying Flame',[2,2],true],
  ['Castellan-Crowe','grey-knight-castellan-crowe','Black Blade of Antwyr',[1,1]],
  ['Grand-Master-Voldus','grey-knight-voldus','Malleus Argyrum',[2,2]],
  ['Brotherhood-Champion','grey-knight-champion','Nemesis force weapon',[1,1]],
  ['Brotherhood-Chaplain','grey-knight-chaplain','Crozius arcanum',[2,2]],
  ['Brotherhood-Techmarine','grey-knight-techmarine','Omnissian power axe',[1,1]],
  ['Brother-captain','grey-knight-brother-captain','Nemesis force weapon',[2,2]],
  ['Venerable-Dreadnought','grey-knight-venerable-dreadnought','Assault cannon',[3,3]],
  ['Kaldor-Draigo','grey-knight-kaldor-draigo','The Titansword',[2,2]]
];
for (const [anchor,id,chosen,size,startingAvailable=false] of entries) {
  const start = html.indexOf(`<a id="${anchor}"`);
  if (start < 0) throw new Error(`Missing ${anchor}`);
  const block = html.slice(start, html.indexOf('<a id="', start+10));
  const stats = [...block.matchAll(/class="dsCharValue[^>]*>([^<]*)/g)].map(m=>m[1]);
  const weapons = [...block.matchAll(/<tr class="dsWeaponRow">([\s\S]*?)<\/tr>/g)].map(m=>{
    const row=m[1];
    const name=clean(row.match(/class="dsWeaponName">([\s\S]*?)<\/b>/)[1]);
    const values=[...row.matchAll(/class="ct pad2626">([\s\S]*?)<\/div>/g)].map(m=>clean(m[1]));
    const keywords=[...row.matchAll(/class="kwbw[^>]*>([\s\S]*?)<\/span><\/span>/g)].map(m=>clean(m[1]));
    return {name,range:values[0]==='Melee'?0:Number.parseInt(values[0]),attacks:values[1],hit:Number.parseInt(values[2])||2,strength:Number(values[3]),ap:Number(values[4]),damage:values[5],keywords};
  });
  const invuln=Number.parseInt(block.match(/class="dsCharInvulValue[^>]*>([^<]*)/)?.[1])||7;
  const abilities=[...block.matchAll(/class="dsAbility"[^>]*><b>(.*?)<\/b>/g)].map(m=>clean(m[1]).replace(/:$/,''));
  const core=block.match(/class="dsCoreArmyValue">([\s\S]*?)<\/td>/)?.[1];
  const coreAbilities=core?clean(core).split(',').map(s=>s.trim()):[];
  const points=Number(block.match(/class="PriceTag">(\d+)/)?.[1]);
  const composition=clean(block.slice(block.indexOf('UNIT COMPOSITION')+16,block.indexOf('class="dsUnitCostHeader"'))).replace(/<[^>]*$/,'').trim();
  const profile={movement:Number.parseInt(stats[0]),toughness:Number(stats[1]),save:Number.parseInt(stats[2]),wounds:Number(stats[3]),leadership:Number.parseInt(stats[4]),oc:Number(stats[5]),invuln};
  const source=`https://wahapedia.ru/wh40k11ed/factions/grey-knights/${anchor}`;
  let unit=faction.units.find(u=>u.id===id);
  if (!unit) {
    const weapon=weapons.find(w=>w.name.toLowerCase()===chosen.toLowerCase());
    if(!weapon || !points || !profile.toughness) throw new Error(`Incomplete ${anchor}: ${chosen}`);
    const character=coreAbilities.includes('Leader');
    const epic=/Castellan|Voldus|Draigo/.test(anchor);
    unit={id,name:anchor.replaceAll('-',' '),points,stock:character?1:2,size,models:character?1:5,role:epic?'Epic Hero · Leader':character?'Character · Leader':'Elite',startingAvailable,keywords:['Infantry','Psyker','Imperium','Grey Knights',...(character?['Character','Leader']:[]),...(epic?['Epic Hero']:[]),...(/Paladin|Voldus|Chaplain|captain|Draigo/.test(anchor)?['Terminator']:[])],leadership:profile.leadership,oc:profile.oc,abilities:[...abilities,...coreAbilities,'Gate of Infinity'],defense:{toughness:profile.toughness,save:profile.save,wounds:profile.wounds,invuln},weapon};
    if(character) {
      const leaderBlock=block.slice(block.indexOf('>LEADER<'),block.indexOf('KEYWORDS:'));
      const targets=[...leaderBlock.matchAll(/href="[^"]*#([^"#]+)"/g)].map(m=>entries.find(e=>e[0]===m[1])?.[1]).filter(Boolean);
      unit.leader={targets:[...new Set(targets)],grant:{}};
    }
    faction.units.push(unit);
  }
  const leaderTargets={
    'grey-knight-castellan-crowe':['grey-knight-purifiers'],
    'grey-knight-voldus':['grey-knight-terminators','grey-knight-paladins'],
    'grey-knight-champion':['grey-knight-purgation','grey-knight-strike-squad'],
    'grey-knight-chaplain':['grey-knight-terminators','grey-knight-paladins'],
    'grey-knight-techmarine':['grey-knight-purgation','grey-knight-purifiers','grey-knight-strike-squad'],
    'grey-knight-brother-captain':['grey-knight-terminators','grey-knight-paladins'],
    'grey-knight-kaldor-draigo':['grey-knight-terminators','grey-knight-paladins']
  };
  if(leaderTargets[id]) unit.leader.targets=leaderTargets[id];
  if(id==='grey-knight-paladins') unit.models=4;
  if(id==='grey-knight-brother-captain') unit.name='Brother-Captain';
  if(id==='grey-knight-venerable-dreadnought') {
    Object.assign(unit,{name:'Venerable Dreadnought',models:1,stock:1,role:'Walker · Character',startingAvailable:false,keywords:['Vehicle','Walker','Character','Psyker','Smoke','Imperium','Grey Knights']});
  }
  unit.datasheet={source,retrieved:'2026-10-25',profile,weapons,abilities:[...abilities,...coreAbilities,'Gate of Infinity'],abilitySummary:summaries[anchor],composition};
  if(id==='grey-knight-kaldor-draigo') { unit.startingAvailable=false; unit.datasheet.classification='LEGENDS'; }
}
roster.source.greyKnights={url:'https://wahapedia.ru/wh40k11ed/factions/grey-knights/datasheets.html',retrieved:'2026-10-25',notice:'Additional Grey Knights use the smallest listed unit and first-unit points. Rectangular footprints and stock are game adaptations. Existing combat profiles are preserved; datasheet reference profiles may differ. One chosen weapon resolves in automatic combat; other weapons and ability names are reference information.'};
// Preserve the compact style of the existing dataset.
const baseline=fs.readFileSync(file,'utf8');
const original=JSON.parse(baseline);
// Limit the diff to the faction and its source metadata, preserving other formatting.
const first=baseline.indexOf('        {"id":"grey-knight-strike-squad"');
const end=baseline.indexOf('\n      ]',first);
if(first<0 || end<0) {
  fs.writeFileSync(file,JSON.stringify(roster,null,2).replace(/        \{\n[\s\S]*?\n        \}/g,chunk=>'        '+JSON.stringify(JSON.parse(chunk)))+'\n');
} else {
  let output=baseline.slice(0,first)+faction.units.map(u=>'        '+JSON.stringify(u)).join(',\n')+baseline.slice(end);
  const notice=JSON.stringify(original.source.notice);
  if(original.source.greyKnights) output=output.replace(JSON.stringify(original.source.greyKnights),JSON.stringify(roster.source.greyKnights));
  else output=output.replace(notice,notice+',\n    "greyKnights": '+JSON.stringify(roster.source.greyKnights));
  fs.writeFileSync(file,output);
}
console.log(`Grey Knights: ${faction.units.length} units with reference profiles`);
