import { BATTLE_HONOURS, WARGEAR, RESEARCH, CAMPAIGN_TIERS, SECTOR_NAMES, STRATAGEMS } from '../data/units.js';

const SAVE_KEY = 'void-runner-40k-campaign-v2';
const RUN_KEY = 'combat-patrol-active-v3';
const UNIT_SIZES = [
  {tierIndex:0,label:'COMBAT PATROL'},
  {tierIndex:1,label:'INCURSION'},
  {tierIndex:3,label:'STRIKE FORCE'},
  {tierIndex:4,label:'ONSLAUGHT'}
];
const MISSION_SCRIPTS = [
  {title:'THE ASHEN TITHE',quote:'Astropathic choirs report a breach beneath Ashen Reach. Confirm daemonic manifestation, seal the rift and leave no witness to the corruption.',objective:'Secure Ashen Reach and identify the source of the incursion.',reward:'ORDO REQUISITION · SECTOR COMMAND AUTHORITY'},
  {title:'GHOSTS OF KARST',quote:'Karst Void has fallen silent under cipher Vermilion. Recover the black signal and purge every vessel that answers it.',objective:'Trace the warp signal through Karst Void.',reward:'CLASSIFIED OBJECTIVE · UNLOCK NAVIGATION CHART'},
  {title:'THE MOURNING GATE',quote:'A false beacon carries the voices of the dead. Break the summoning lattice before the Mourning Gate becomes a permanent wound.',objective:'Destroy the daemonhost controlling the Mourning Gate.',reward:'ORDO REQUISITION · PERMANENT SANCTION'},
  {title:'CROWN OF CINDERS',quote:'The Cinder Crown conceals the architect of this incursion. Invoke the final canticles and bring the entire station to judgement.',objective:'Banish the sector daemon and secure the campaign.',reward:'PRIORITY EXTREMIS · MAXIMUM REQUISITION'},
  {title:'THE IRON CATECHISM',quote:'A corrupted war engine has awakened beneath the iron moons. Its machine spirit must be exorcised before it reaches the populated systems.',objective:'Board the war engine and destroy its profane core.',reward:'CLASSIFIED OBJECTIVE · PERMANENT SANCTION'},
  {title:'THE HOLLOW THRONE',quote:'An empty throne is broadcasting a psychic command across the sector. Silence its claimants and recover the forbidden reliquary intact.',objective:'Purge the throne complex and contain the relic.',reward:'ORDO REQUISITION · CAMPAIGN ADVANCE'},
  {title:'BLACK SUN PROTOCOL',quote:'The sanctioned charts end at a black sun. Proceed under seal, locate the breach and deny the enemy all passage into realspace.',objective:'Chart the forbidden system and close the warp breach.',reward:'CLASSIFIED OBJECTIVE · PERMANENT SANCTION'},
  {title:'THE LAST SEAL',quote:'The final ward is failing. Commit the brotherhood, complete the banishment and consign every record of this place to flame.',objective:'Complete the final Inquisitorial directive.',reward:'PRIORITY ABSOLUTE · CAMPAIGN VICTORY'}
];
const INTRO_SCRIPT = [
  'Across the Imperium, worlds fall silent. Heresy spreads. The veil between reality and the Warp grows thin.',
  "You command a strike force of the Grey Knights, the Emperor's secret warriors, dispatched where entire armies would fail.",
  'Your brothers are few. Your duty is eternal.',
  'By the authority of the Holy Ordo Malleus, seek the corruption. Banish the daemon. Suffer not the unclean to endure.',
  'No witness. No glory. Only duty.'
];
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const pick = list => list[Math.floor(Math.random() * list.length)];
const shuffle = list => [...list].sort(() => Math.random() - .5);
const d6 = () => 1 + Math.floor(Math.random() * 6);
const playerD6 = () => {
  const first = d6();
  return first <= 2 && Math.random() < .4 ? d6() : first;
};
const RULE_SYMBOLS = [
  [/Blast/i,'✹'], [/Rapid Fire/i,'»'], [/Melta/i,'◈'], [/Torrent/i,'≋'],
  [/Devastating/i,'☠'], [/Twin-?linked/i,'⟳'], [/Sustained/i,'✦'], [/Lethal/i,'†'],
  [/Anti-/i,'⌖'], [/Assault/i,'➜'], [/Heavy/i,'▰'], [/Oath/i,'◎'], [/Deep Strike/i,'⇣'],
  [/Synapse/i,'⌁'], [/Waaagh/i,'!'], [/Chivalric/i,'♜'], [/Psychic|Sorcery/i,'✧'], [/Leader|Rites|Alpha Warrior|Da Boss/i,'♛']
];
const ruleSymbol = rule => RULE_SYMBOLS.find(([pattern]) => pattern.test(rule))?.[1] || '◆';
const BATTLE_ART = {
  'space-marines': {src:new URL('../../gif/spacemarine_A.gif', import.meta.url).href, facing:'right'},
  'grey-knights': {src:new URL('../../gif/greyknight_A.gif', import.meta.url).href, facing:'right'},
  'custodes': {src:new URL('../../gif/custodes.gif', import.meta.url).href, facing:'right'},
  'astra-militarum': {src:new URL('../../gif/cadian_A.gif', import.meta.url).href, facing:'right'},
  'death-guard': {src:new URL('../../gif/deathguard_A.gif', import.meta.url).href, facing:'right'},
  'eldar': {src:new URL('../../gif/eldar_A.gif', import.meta.url).href, facing:'right'},
  'harlequins': {src:new URL('../../gif/eldar_HarlequinnStorm.gif', import.meta.url).href, facing:'right'},
  'imperial-fists': {src:new URL('../../gif/imperialfist.gif', import.meta.url).href, facing:'left'},
  'kroot-ravagers': {src:new URL('../../gif/kroot_ravager.gif', import.meta.url).href, facing:'left'},
  'adeptus-mechanicus': {src:new URL('../../gif/mechanicus_A.gif', import.meta.url).href, facing:'right'},
  'necrons': {src:new URL('../../gif/necro_A.gif', import.meta.url).href, facing:'left'},
  'adepta-sororitas': {src:new URL('../../gif/sorista_A.gif', import.meta.url).href, facing:'right'},
  'space-wolves': {src:new URL('../../gif/spacewolve.gif', import.meta.url).href, facing:'right'},
  'tau-ground-patrol': {src:new URL('../../gif/tau_GroundPatrol.gif', import.meta.url).href, facing:'right'},
  'tau-drone-patrol': {src:new URL('../../gif/Tau_DronePatrol.gif', import.meta.url).href, facing:'left'},
  'thousand-sons': {src:new URL('../../gif/thousandsons.gif', import.meta.url).href, facing:'left'},
  'orks': {src:new URL('../../gif/WAAAAAgon.gif', import.meta.url).href, facing:'left'},
  'tyranids': {src:new URL('../../gif/tyranids_A.gif', import.meta.url).href, facing:'right'},
  'imperial-knights': {src:new URL('../../gif/imperial_knight.gif', import.meta.url).href, facing:'left'}
};
const CHAPTERS = [
  {id:'grey-knights',label:'GREY KNIGHT',art:new URL('../../assets/chapter-grey-knight.jpg',import.meta.url).href,locked:false},
  {id:'space-marines',label:'ULTRAMARINE',art:new URL('../../assets/chapter-ultramarines.webp',import.meta.url).href,locked:true},
  {id:'imperial-fists',label:'IMPERIAL FIST',art:new URL('../../assets/chapter-imperial-fist.webp',import.meta.url).href,locked:true}
];
const GALAXY_SYSTEM_LAYOUT = [
  {x:32,y:22,size:1.22,tone:'gold'},{x:66,y:14,size:.88,tone:'blue'},{x:54,y:38,size:1.05,tone:'white'},
  {x:75,y:56,size:.78,tone:'red'},{x:30,y:56,size:.94,tone:'blue'},{x:55,y:73,size:.7,tone:'white'},
  {x:25,y:85,size:.68,tone:'red'},{x:77,y:86,size:.62,tone:'gold'}
];
const SYSTEM_DESTINATION_LAYOUT = [
  {x:27,y:31,size:1.05,tone:'amber'},{x:73,y:34,size:.86,tone:'ice'},{x:59,y:74,size:1.16,tone:'crimson'}
];
const GREY_KNIGHT_UNIT_ART = {
  'grey-knight-strike-squad':[
    new URL('../../assets/units/grey-knights/strike-squad.png',import.meta.url).href,
    new URL('../../assets/units/grey-knights/strike-brother.png',import.meta.url).href
  ],
  'grey-knight-terminators':[
    new URL('../../assets/units/grey-knights/terminator-hammer.png',import.meta.url).href,
    new URL('../../assets/units/grey-knights/terminator-staff.png',import.meta.url).href
  ],
  'nemesis-dreadknight':[
    new URL('../../assets/units/grey-knights/nemesis-dreadknight.png',import.meta.url).href,
    new URL('../../assets/units/grey-knights/dreadnought.png',import.meta.url).href
  ],
  'brotherhood-librarian':[
    new URL('../../assets/units/grey-knights/brotherhood-librarian.png',import.meta.url).href
  ]
};
const UNIT_SPRITES = {
  'intercessor-squad':[0,0], 'terminator-squad':[1,0], 'redemptor-dreadnought':[2,0], 'captain':[3,0],
  'boyz':[0,1], 'meganobz':[1,1], 'deff-dread':[2,1], 'warboss':[3,1],
  'termagants':[0,2], 'tyranid-warriors':[1,2], 'screamer-killer':[2,2], 'winged-tyranid-prime':[3,2],
  'armiger-helverin':[0,3], 'armiger-warglaive':[1,3], 'knight-paladin':[2,3], 'acastus-knight-asterius':[3,3],
  'grey-knight-strike-squad':[0,0], 'grey-knight-terminators':[1,0], 'nemesis-dreadknight':[2,0], 'brotherhood-librarian':[3,0]
};
const unitSpriteStyle = (id, variant = 0) => {
  const unitArt = GREY_KNIGHT_UNIT_ART[id];
  if (unitArt) {
    const src = unitArt[variant % unitArt.length];
    return `--unit-art:url(${src});--unit-art-size:contain;--unit-art-position:center`;
  }
  const hash = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const [column, row] = UNIT_SPRITES[id] || [hash % 4, Math.floor(hash / 4) % 4];
  return `--icon-x:${column * 100 / 3}%;--icon-y:${row * 100 / 3}%`;
};

function weaponRules(weapon, halfRange = false) {
  const rules = { unsupported: [] };
  for (const raw of weapon.keywords || []) {
    const token = String(raw).trim();
    let match;
    if (/^Torrent$/i.test(token)) rules.torrent = true;
    else if (/^Lethal Hits$/i.test(token)) rules.lethalHits = true;
    else if (/^Devastating Wounds$/i.test(token)) rules.devastatingWounds = true;
    else if (/^Twin-?linked$/i.test(token)) rules.woundReroll = 'failed';
    else if ((match = token.match(/^Sustained Hits (\d+)$/i))) rules.sustainedHits = Number(match[1]);
    else if ((match = token.match(/^Blast(?: (\d+))?$/i))) rules.blast = Number(match[1] || 1);
    else if ((match = token.match(/^Rapid Fire (.+)$/i))) rules.rapidFire = halfRange ? match[1] : null;
    else if ((match = token.match(/^Melta (\d+)$/i))) rules.melta = halfRange ? Number(match[1]) : 0;
    else if ((match = token.match(/^Anti-(Infantry|Monster|Vehicle) (\d)\+$/i))) rules[`anti${match[1]}`] = Number(match[2]);
    else if (/^(Assault|Heavy|Ignores Cover|Pistol|Cleave(?: \d+)?)$/i.test(token)) rules[token.toLowerCase()] = true;
    else rules.unsupported.push(token);
  }
  return rules;
}

function rollExpression(value, favored = false) {
  const text = String(value).replace(/\s/g, '').toUpperCase();
  if (/^\d+$/.test(text)) return { total: Number(text), rolls: [], flat: Number(text) };
  const match = text.match(/^(\d*)D(3|6)(?:\+(\d+))?$/);
  if (!match) return { total: 1, rolls: [], flat: 1 };
  const count = Number(match[1] || 1);
  const sides = Number(match[2]);
  const flat = Number(match[3] || 0);
  const rolls = Array.from({length:count}, () => {
    const first = 1 + Math.floor(Math.random() * sides);
    return favored && first <= Math.ceil(sides / 3) && Math.random() < .4 ? 1 + Math.floor(Math.random() * sides) : first;
  });
  return { total: rolls.reduce((sum, roll) => sum + roll, flat), rolls, flat };
}

function woundTarget(strength, toughness) {
  if (strength >= toughness * 2) return 2;
  if (strength > toughness) return 3;
  if (strength === toughness) return 4;
  if (strength * 2 <= toughness) return 6;
  return 5;
}

export class Game {
  constructor(roster) {
    this.roster = roster;
    this.factions = roster.factions;
    this.units = this.factions.flatMap(faction => faction.units.map(unit => ({...unit, faction:faction.id, color:faction.color, mark:faction.mark})));
    this.meta = this.load(SAVE_KEY, { currency: 0, research: { logistics: 0, doctrine: 0, salvage: 0, insurance: 0 }, runs: 0, wins: 0 });
    this.run = this.load(RUN_KEY, null);
    this.meta.settings ||= {};
    if (this.run) {
      this.run.story ||= {briefed:[],completed:[],pendingBriefing:null};
      this.run.story.briefed ||= [];
      this.run.story.completed ||= [];
      this.run.story.pendingBriefing ??= null;
    }
    this.selectedFaction = this.run?.faction || this.factions[0].id;
    this.selectedBlueprint = null;
    this.selectedPlaced = null;
    this.rotated = false;
    this.battle = null;
    this.battleTimer = null;
    this.battleSpeed = 1;
    this.currentScreen = 'home';
    this.setupStage = 'tier';
    this.loadoutReturn = 'hub';
    this.introTimer = null;
    this.introComplete = false;
    this.galaxyScene = null;
    this.galaxyMountId = 0;
    this.galaxyModulePromise = import('../render/GalaxyMap3D.js');
    this.setupChoice = {tier:null,faction:null};
    this.bindUI();
    document.body.classList.toggle('reduced-motion', Boolean(this.meta.settings?.reducedMotion));
    this.renderHome();
    this.show('home');
    window.addEventListener('pagehide', () => this.save({silent:true}));
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') this.save({silent:true}); });
  }

  load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }

  save() {
    try {
      this.meta.lastSavedAt = Date.now();
      localStorage.setItem(SAVE_KEY, JSON.stringify(this.meta));
      if (this.run) localStorage.setItem(RUN_KEY, JSON.stringify(this.run));
      else localStorage.removeItem(RUN_KEY);
    } catch (error) {
      console.error('Save failed', error);
    }
    this.renderHeader();
  }

  bindUI() {
    $('#new-run-button').onclick = () => this.beginSetup();
    $('#resume-button').onclick = () => this.resumeRun();
    $('#intro-continue-button').onclick = () => this.continueIntro();
    $('#hub-army-button').onclick = () => this.openLoadout('hub');
    $('#hub-upgrades-button').onclick = () => { this.renderResearch(); this.show('research'); };
    $('#hub-missions-button').onclick = () => this.openStrategium();
    $('#settings-button').onclick = () => $('#settings-dialog').showModal();
    $('#credits-button').onclick = () => $('#credits-dialog').showModal();
    $('#close-settings-button').onclick = () => $('#settings-dialog').close();
    $('#close-credits-button').onclick = () => $('#credits-dialog').close();
    $('#mission-accept-button').onclick = () => this.acceptMission();
    $('#mission-belay-button').onclick = () => this.closeMissionBriefing();
    $('#mission-log-button').onclick = () => this.openMissionBriefing(this.run?.region, true);
    $('#reduced-motion-toggle').onchange = event => {
      this.meta.settings = {...this.meta.settings,reducedMotion:event.target.checked};
      document.body.classList.toggle('reduced-motion', event.target.checked); this.save();
    };
    $('#event-continue-button').onclick = () => this.finishPostWarEvent();
    $('#close-help-button').onclick = () => $('#help-dialog').close();
    $('#remove-button').onclick = () => this.removeSelected();
    $('#clear-button').onclick = () => {
      if (!this.run) return;
      this.run.deployed = [];
      for (const gear of this.run.gear) gear.equippedTo = null;
      this.selectedPlaced = null;
      this.renderLoadout(); this.save();
    };
    $('#deploy-button').onclick = () => this.finishPrep();
    $('#speed-button').onclick = () => this.toggleSpeed();
    $('#skip-button').onclick = () => this.resolveBattleNow();
    $('#run-end-button').onclick = () => this.handleEndButton();
    for (const button of $$('.command-return')) button.onclick = () => { this.save(); this.renderHub(); this.show('hub'); };
    for (const button of $$('[data-prep-tab]')) button.onclick = () => this.setPrepTab(button.dataset.prepTab);
  }

  faction(id) { return this.factions.find(faction => faction.id === id); }
  unit(id) { return this.units.find(unit => unit.id === id); }

  setupBattleStage(enemyFaction) {
    if (!window.matchMedia('(min-width:1100px)').matches) return;
    const assignments = [['player', this.run.faction, 'right'], ['enemy', enemyFaction, 'left']];
    for (const [side, factionId, desiredFacing] of assignments) {
      const art = BATTLE_ART[factionId] || BATTLE_ART['space-marines'];
      const figure = $(`.battle-wing-${side}`);
      const image = $(`#battle-art-${side}`);
      image.src = art.src;
      figure.className = `battle-wing battle-wing-${side}`;
      figure.classList.toggle('flip', art.facing !== desiredFacing);
    }
    $('#desktop-battle-stage').className = 'desktop-battle-stage';
  }

  clearBattleStage() {
    document.body.classList.remove('battle-active');
    $('#app').classList.remove('combat-shake', 'combat-shake-heavy');
  }

  fireBattleBeam(side) {
    const stage = $('#desktop-battle-stage');
    if (!document.body.classList.contains('battle-active')) return;
    stage.classList.remove('firing-player', 'firing-enemy');
    void stage.offsetWidth;
    stage.classList.add(`firing-${side}`);
  }

  triggerBattleImpact(plan) {
    if (!plan.damageLost || !document.body.classList.contains('battle-active')) return;
    const stage = $('#desktop-battle-stage');
    const frame = $('#app');
    const heavy = plan.targetRef.dead || plan.devastating > 0 || plan.lethal > 0;
    stage.classList.remove('impact-player', 'impact-enemy', 'impact-heavy');
    frame.classList.remove('combat-shake', 'combat-shake-heavy');
    void stage.offsetWidth;
    stage.classList.add(`impact-${plan.targetRef.side}`, ...(heavy ? ['impact-heavy'] : []));
    frame.classList.add(heavy ? 'combat-shake-heavy' : 'combat-shake');
    clearTimeout(this.impactTimer);
    this.impactTimer = setTimeout(() => {
      stage.classList.remove('impact-player', 'impact-enemy', 'impact-heavy');
      frame.classList.remove('combat-shake', 'combat-shake-heavy');
    }, heavy ? 760 : 430);
  }

  renderHeader() {
    // Navigation is handled by the consistent bottom return control.
  }

  show(name) {
    if (name !== 'sector' && name !== 'map') {
      this.galaxyMountId++;
      this.galaxyScene?.destroy();
      this.galaxyScene = null;
    }
    for (const screen of $$('.screen')) screen.classList.toggle('active', screen.id === `${name}-screen`);
    document.body.classList.toggle('main-menu-open', name === 'home');
    document.body.classList.toggle('intro-open', name === 'intro');
    document.body.classList.toggle('hub-open', name === 'hub');
    document.body.classList.toggle('battle-active', name === 'battle');
    document.body.classList.toggle('star-chart-open', name === 'sector' || name === 'map');
    if (name !== 'battle') this.clearBattleStage();
    this.currentScreen = name;
    if (this.run && name !== 'battle') { this.run.lastScreen = name; this.save({silent:true}); }
    window.scrollTo(0, 0);
    this.renderHeader();
  }

  goBack() {
    if (this.battle) return;
    if (this.currentScreen === 'intro') { this.stopIntro(); this.renderHome(); return this.show('home'); }
    if (this.currentScreen === 'hub') { this.renderHome(); return this.show('home'); }
    if (this.currentScreen === 'setup') {
      if (this.setupStage === 'faction') return this.renderSetup('tier');
      this.renderHome(); return this.show('home');
    }
    if (this.currentScreen === 'loadout') {
      if (this.run?.pendingNode || this.loadoutReturn === 'map') { this.renderMap(); return this.show('map'); }
      if (this.loadoutReturn === 'sector') { this.renderSectors(); return this.show('sector'); }
      this.renderHub(); return this.show('hub');
    }
    if (this.currentScreen === 'map' || this.currentScreen === 'sector' || this.currentScreen === 'research') { this.renderHub(); return this.show('hub'); }
    if (this.currentScreen === 'reward') return;
    this.renderHome(); this.show('home');
  }

  renderHome() {
    $('#resume-button').hidden = !this.run;
    $('#new-run-button').textContent = this.run ? 'NEW GAME' : 'START';
    $('#reduced-motion-toggle').checked = Boolean(this.meta.settings?.reducedMotion);
    this.renderHeader();
  }

  beginIntro() {
    this.stopIntro();
    this.introComplete = false;
    $('#intro-copy').innerHTML = '';
    $('#intro-continue-button').textContent = 'ASSUME COMMAND';
    this.show('intro');
    const full = INTRO_SCRIPT.join('\n');
    if (this.meta.settings?.reducedMotion) return this.finishIntroText();
    let index = 0;
    this.introTimer = setInterval(() => {
      index++;
      this.renderIntroText(full.slice(0, index));
      if (index >= full.length) this.finishIntroText();
    }, 24);
  }

  renderIntroText(text) {
    const lines = text.split('\n');
    $('#intro-copy').replaceChildren(...lines.map(line => {
      const paragraph = document.createElement('p');
      const knightName = 'Grey Knights';
      if (line.includes(knightName)) {
        const [before, after] = line.split(knightName);
        paragraph.append(before);
        const strong = document.createElement('strong'); strong.textContent = knightName; paragraph.append(strong, after);
      } else paragraph.textContent = line;
      if (line === INTRO_SCRIPT.at(-1)) paragraph.classList.add('intro-oath');
      return paragraph;
    }));
  }

  finishIntroText() {
    this.stopIntro();
    this.renderIntroText(INTRO_SCRIPT.join('\n'));
    this.introComplete = true;
    $('#intro-continue-button').textContent = 'ASSUME COMMAND';
  }

  stopIntro() { if (this.introTimer) clearInterval(this.introTimer); this.introTimer = null; }

  continueIntro() {
    if (!this.introComplete) return this.finishIntroText();
    this.startRun();
  }

  beginSetup() {
    this.setupChoice = {tier:null,faction:null};
    this.renderSetup('tier');
    this.show('setup');
  }

  renderSetup(stage) {
    this.setupStage = stage;
    const list = $('#setup-options'); list.innerHTML = '';
    $('#setup-title').textContent = stage === 'tier' ? 'CHOOSE UNIT SIZE' : 'CHOOSE YOUR CHAPTER';
    list.classList.toggle('chapter-grid',stage === 'faction');
    if (stage === 'tier') UNIT_SIZES.forEach(({tierIndex,label}) => {
      const tier = CAMPAIGN_TIERS[tierIndex];
      const button = document.createElement('button'); button.className = 'setup-card tier-card';
      button.innerHTML = `<span>${tier.points}</span><b>${label}</b>`;
      button.onclick = () => { this.setupChoice.tier = tierIndex; this.renderSetup('faction'); }; list.append(button);
    });
    if (stage === 'faction') CHAPTERS.forEach(chapter => {
      const button = document.createElement('button'); button.className = `chapter-card ${chapter.locked ? 'locked' : ''}`;
      button.disabled = chapter.locked;
      button.innerHTML = `<img src="${chapter.art}" alt=""><b>${chapter.label}</b>`;
      button.onclick = () => { this.setupChoice.faction = chapter.id; this.beginIntro(); }; list.append(button);
    });
  }

  startRun() {
    const tier = CAMPAIGN_TIERS[this.setupChoice.tier ?? 0];
    this.selectedFaction = this.setupChoice.faction || 'grey-knights';
    const factionUnits = this.units.filter(unit => unit.faction === this.selectedFaction);
    this.run = {
      seed: Date.now(), faction: this.selectedFaction, tierIndex:this.setupChoice.tier ?? 0, region:null, step:0, cap:tier.points,
      hull: 3 + (this.meta.research.insurance || 0), maxHull: 3 + (this.meta.research.insurance || 0),
      data:0, stars:0, sectorStars:0, currency:0, chests:0, protocols:[], stratagems:[], gear:[], deployed:[], history:[], offers:null,
      sectors:Array.from({length:tier.sectors},(_,i)=>({id:i,name:SECTOR_NAMES[i],status:i===0?'available':'locked',stars:0})),
      unlockedUnits:factionUnits.slice(0,2).map(unit=>unit.id), battles:0, bosses:0, pendingNode:null, pendingPostWar:null,
      story:{briefed:[],completed:[],pendingBriefing:null}
    };
    this.run.cap = this.getBaseCap();
    this.meta.runs++;
    this.selectedBlueprint = factionUnits[0]?.id || null;
    this.selectedPlaced = null;
    this.save();
    this.renderHub(); this.show('hub');
  }

  resumeRun() {
    if (!this.run) return;
    if (this.run.story?.pendingBriefing !== null && this.run.story?.pendingBriefing !== undefined) {
      this.renderSectors(); this.show('sector'); return this.openMissionBriefing(this.run.story.pendingBriefing);
    }
    if (this.run.rewardContext) {
      this.ensureRewardState(this.run.rewardContext);
      this.renderRewardSegments();
      const node = this.run.rewardContext.node;
      $('#reward-data').textContent = `+${node.stars || 0} ★`;
      $('#reward-gear-line').textContent = `${node.type === 'boss' ? 90 * (node.bossTier || 1) : 20 + node.stars * 10} CAMPAIGN SCORE`;
      return this.show('reward');
    }
    if (this.run.pendingPostWar) {
      const event = this.run.pendingPostWar.node?.event;
      if (event === 'recruit') return this.openRecruitEvent();
      if (event === 'store') return this.openStoreEvent();
      return this.finishPostWarEvent();
    }
    if (this.run.pendingNode) return this.openLoadout('map');
    this.renderHub(); this.show('hub');
  }

  renderHub() {
    if (!this.run) return;
    $('#hub-army-status').textContent = `${this.usedPoints()} / ${this.getBaseCap()} PTS`;
    $('#hub-req-status').textContent = `◆ ${this.meta.currency}`;
    $('#hub-mission-label').textContent = 'OPERATION';
  }

  openStrategium() {
    if (!this.run) return;
    if (this.run.region !== null) { this.renderMap(); return this.show('map'); }
    this.renderSectors(); this.show('sector');
  }

  protocolEffects() {
    const effects = {};
    for (const id of this.run.protocols) {
      const next = BATTLE_HONOURS.find(item => item.id === id)?.effect || {};
      for (const [key, value] of Object.entries(next)) effects[key] = typeof value === 'number' ? (effects[key] || 0) + value : value;
    }
    return effects;
  }

  getBaseCap() {
    return CAMPAIGN_TIERS[this.run.tierIndex].points + (this.meta.research.logistics || 0) * 50 + (this.protocolEffects().pointBonus || 0);
  }

  usedPoints() {
    return this.run.deployed.reduce((sum, placed) => sum + this.unit(placed.unitId).points, 0);
  }

  openLoadout(returnTo = null) {
    if (!this.run) return;
    if (returnTo) this.loadoutReturn = returnTo;
    this.renderLoadout();
    this.show('loadout');
  }

  renderLoadout() {
    this.run.cap = this.getBaseCap();
    const used = this.usedPoints();
    $('#used-points').textContent = used;
    $('#loadout-cap').textContent = `/ ${this.run.cap}`;
    $('#capacity-fill').style.width = `${clamp(used / this.run.cap * 100, 0, 100)}%`;
    $('#capacity-fill').parentElement.classList.toggle('over', used > this.run.cap);
    $('#gear-count').textContent = this.run.gear.length;
    this.renderFormation();
    this.renderRoster();
    this.renderGear();
    this.renderProtocols();
    const legal = used > 0 && used <= this.run.cap;
    $('#deploy-button').disabled = Boolean(this.run.pendingNode) && !legal;
    $('#deploy-button').textContent = this.run.pendingNode ? '⚔ BATTLE' : this.loadoutReturn === 'map' ? '⌖ RETURN TO CHART' : '← RETURN TO COMMAND DECK';
    const chosen = this.unit(this.selectedBlueprint);
    $('#prep-status').textContent = legal ? `▦ ${this.run.deployed.length} · ${this.run.cap - used} FREE` : chosen ? `▸ ${chosen.name.toUpperCase()}` : '▦ SELECT';
  }

  renderFormation() {
    const grid = $('#formation-grid');
    grid.innerHTML = '';
    for (let y = 0; y < 5; y++) for (let x = 0; x < 6; x++) {
      const cell = document.createElement('button');
      cell.className = 'grid-cell';
      cell.setAttribute('aria-label', `Grid column ${x + 1}, row ${y + 1}`);
      cell.onclick = () => this.placeUnit(x, y);
      grid.append(cell);
    }
    for (const placed of this.run.deployed) {
      const unit = this.unit(placed.unitId);
      const artVariant = this.run.deployed.filter(item => item.unitId === placed.unitId).findIndex(item => item.id === placed.id);
      const [w, h] = this.sizeFor(unit, placed.rotated);
      const el = document.createElement('button');
      el.className = `grid-unit ${this.selectedPlaced === placed.id ? 'selected' : ''} ${placed.attachedTo ? 'attached' : ''}`;
      el.style.setProperty('--unit-color', unit.color);
      el.style.left = `calc(${placed.x} * ((100% - 10px) / 6 + 2px))`;
      el.style.top = `calc(${placed.y} * (var(--cell) + 2px))`;
      el.style.width = `calc(${w} * ((100% - 10px) / 6) + ${(w - 1) * 2}px)`;
      el.style.height = `calc(${h} * var(--cell) + ${(h - 1) * 2}px)`;
      el.innerHTML = `<span class="grid-unit-icon" style="${unitSpriteStyle(unit.id,artVariant)}" aria-hidden="true"></span><small>${unit.points}</small>`;
      el.title = `${unit.name} · ${unit.role} · ${unit.points} points`;
      el.onclick = event => {
        event.stopPropagation();
        const leader = this.unit(this.selectedBlueprint);
        if (leader?.leader && !placed.attachedTo) return this.attachLeader(leader, placed);
        this.selectedPlaced = placed.id; this.selectedBlueprint = null; this.renderLoadout();
      };
      grid.append(el);
    }
  }

  renderRoster() {
    const roster = $('#unit-roster');
    roster.innerHTML = '';
    for (const unit of this.units.filter(item => item.faction === this.run.faction)) {
      const deployedCount = this.run.deployed.filter(item => item.unitId === unit.id).length;
      const out = deployedCount >= unit.stock;
      const tooLarge = unit.points > this.run.cap;
      const unrecovered = !this.run.unlockedUnits.includes(unit.id);
      const button = document.createElement('button');
      button.className = `unit-card ${this.selectedBlueprint === unit.id ? 'selected' : ''} ${out || tooLarge || unrecovered ? 'locked' : ''}`;
      button.style.setProperty('--unit-color', unit.color);
      button.disabled = out || tooLarge || unrecovered;
      const weapon = unit.weapon;
      const status = unrecovered ? 'UNRECOVERED · FIND IN SECTOR' : tooLarge ? `LOCKED · ${unit.points} PTS` : unit.leader ? `${unit.size[0]}×${unit.size[1]} · ♛ GRID OR BODYGUARD · ×${unit.stock - deployedCount}` : `${unit.size[0]}×${unit.size[1]} · ◉${unit.models} · ×${unit.stock - deployedCount}`;
      button.setAttribute('aria-label', `${unit.name}, ${unit.points} points, ${status}`);
      button.innerHTML = `<span class="unit-icon" style="${unitSpriteStyle(unit.id,deployedCount)}" aria-hidden="true"></span><span class="unit-copy"><b>${unit.name}</b><small class="unit-meta">${status}</small><span class="stat-chips"><i title="Toughness">T${unit.defense.toughness}</i><i title="Save">SV${unit.defense.save}+</i><i title="Wounds">W${unit.defense.wounds}</i><i title="Leadership">LD${unit.leadership}+</i><i title="Objective Control">OC${unit.oc}</i></span><span class="weapon-line-mini" title="${weapon.name}">⚔ ${weapon.attacks}A · ${weapon.hit}+ · S${weapon.strength} · AP${weapon.ap} · D${weapon.damage}</span></span><span class="unit-cost">${unit.points}<small>PTS</small></span>`;
      button.onclick = () => { this.selectedBlueprint = unit.id; this.selectedPlaced = null; this.renderLoadout(); };
      roster.append(button);
    }
  }

  renderGear() {
    const list = $('#gear-inventory');
    list.innerHTML = '';
    if (!this.run.gear.length) {
      list.innerHTML = '<div class="protocol-card"><span>⚙</span><div><b>EMPTY</b></div></div>';
      return;
    }
    this.run.gear.forEach((item, index) => {
      const gear = WARGEAR.find(entry => entry.id === item.gearId);
      const owner = this.run.deployed.find(unit => unit.id === item.equippedTo);
      const button = document.createElement('button');
      button.className = `gear-card ${owner ? 'equipped' : ''}`;
      const effects = {hitBonus:'+1 HIT',saveBonus:'+1 SAVE',toughness:`+${gear.value} T`,attacksBonus:`+${gear.value} A`,invuln:`${gear.value}++`};
      button.title = gear.desc;
      button.innerHTML = `<span><b>⚙ ${gear.name}</b><small>${effects[gear.stat] || gear.desc}</small></span><span>${owner ? '●' : '○'}</span>`;
      button.onclick = () => this.equipGear(index);
      list.append(button);
    });
  }

  renderProtocols() {
    const list = $('#protocol-list');
    list.innerHTML = '';
    if (!this.run.protocols.length && !(this.run.stratagems || []).length) {
      list.innerHTML = '<div class="protocol-card"><span>✦</span><div><b>EMPTY</b></div></div>';
      return;
    }
    if (this.run.protocols.length) list.insertAdjacentHTML('beforeend','<div class="protocol-heading"><b>ENHANCEMENTS</b><small>PASSIVE · ENTIRE CAMPAIGN</small></div>');
    for (const id of this.run.protocols) {
      const honour = BATTLE_HONOURS.find(item => item.id === id);
      const el = document.createElement('div');
      el.className = 'protocol-card';
      el.title = honour.desc;
      el.innerHTML = `<span>${ruleSymbol(`${honour.name} ${honour.tag}`)}</span><div><b>${honour.name}</b><small>${honour.tag}</small></div>`;
      list.append(el);
    }
    if ((this.run.stratagems || []).length) list.insertAdjacentHTML('beforeend','<div class="protocol-heading tactical"><b>STRATAGEMS</b><small>TACTICAL · CONDITIONAL EFFECTS</small></div>');
    for (const id of this.run.stratagems || []) {
      const stratagem = STRATAGEMS.find(item => item.id === id);
      const el = document.createElement('div'); el.className = 'protocol-card'; el.title = stratagem.desc;
      el.innerHTML = `<span>⌖</span><div><b>${stratagem.name}</b><small>STRATAGEM · ${stratagem.tag}</small></div>`;
      list.append(el);
    }
  }

  setPrepTab(tab) {
    for (const button of $$('[data-prep-tab]')) button.classList.toggle('active', button.dataset.prepTab === tab);
    for (const list of $$('.prep-list')) list.classList.remove('active');
    $(`#${tab === 'units' ? 'unit-roster' : tab === 'gear' ? 'gear-inventory' : 'protocol-list'}`).classList.add('active');
  }

  sizeFor(unit, rotated) { return rotated ? [unit.size[1], unit.size[0]] : unit.size; }

  canPlace(x, y, w, h) {
    if (x + w > 6 || y + h > 5) return false;
    return !this.run.deployed.some(placed => {
      const [pw, ph] = this.sizeFor(this.unit(placed.unitId), placed.rotated);
      return x < placed.x + pw && x + w > placed.x && y < placed.y + ph && y + h > placed.y;
    });
  }

  placeUnit(x, y) {
    const unit = this.unit(this.selectedBlueprint);
    if (!unit) return;
    const [w, h] = this.sizeFor(unit, this.rotated);
    const deployedCount = this.run.deployed.filter(item => item.unitId === unit.id).length;
    if (deployedCount >= unit.stock) return;
    if (this.usedPoints() + unit.points > this.run.cap) { $('#prep-status').textContent = `NEED ${this.usedPoints() + unit.points - this.run.cap} MORE POINTS`; return; }
    if (!this.canPlace(x, y, w, h)) { $('#prep-status').textContent = 'THAT UNIT DOES NOT FIT HERE'; return; }
    this.run.deployed.push({ id: `${unit.id}-${Date.now()}-${Math.random()}`, unitId: unit.id, x, y, rotated: this.rotated });
    this.selectedPlaced = this.run.deployed.at(-1).id;
    this.selectedBlueprint = null;
    this.save();
    this.renderLoadout();
  }

  attachLeader(leader, bodyguard) {
    if (!leader.leader.targets.includes(bodyguard.unitId)) { $('#prep-status').textContent = `${leader.name.toUpperCase()} CANNOT LEAD THAT UNIT`; return; }
    if (this.run.deployed.some(item => item.attachedTo === bodyguard.id)) { $('#prep-status').textContent = 'THAT UNIT ALREADY HAS A LEADER'; return; }
    if (this.usedPoints() + leader.points > this.run.cap) { $('#prep-status').textContent = 'NOT ENOUGH POINTS FOR THAT LEADER'; return; }
    const deployedCount = this.run.deployed.filter(item => item.unitId === leader.id).length;
    if (deployedCount >= leader.stock) return;
    this.run.deployed.push({id:`${leader.id}-${Date.now()}`,unitId:leader.id,x:bodyguard.x,y:bodyguard.y,rotated:false,attachedTo:bodyguard.id});
    this.selectedBlueprint = null;
    this.selectedPlaced = this.run.deployed.at(-1).id;
    this.save();
    this.renderLoadout();
  }

  removeSelected() {
    if (!this.selectedPlaced) return;
    const removing = new Set([this.selectedPlaced, ...this.run.deployed.filter(unit => unit.attachedTo === this.selectedPlaced).map(unit => unit.id)]);
    this.run.deployed = this.run.deployed.filter(unit => !removing.has(unit.id));
    for (const gear of this.run.gear) if (removing.has(gear.equippedTo)) gear.equippedTo = null;
    this.selectedPlaced = null;
    this.save();
    this.renderLoadout();
  }

  equipGear(index) {
    if (!this.selectedPlaced) { $('#prep-status').textContent = 'SELECT A DEPLOYED UNIT FIRST'; return; }
    const item = this.run.gear[index];
    if (item.equippedTo === this.selectedPlaced) item.equippedTo = null;
    else {
      for (const gear of this.run.gear) if (gear.equippedTo === this.selectedPlaced) gear.equippedTo = null;
      item.equippedTo = this.selectedPlaced;
    }
    this.save();
    this.renderLoadout();
  }

  finishPrep() {
    if (!this.run) return;
    if (this.run.pendingNode && (this.usedPoints() <= 0 || this.usedPoints() > this.run.cap)) return;
    this.save();
    if (this.run.pendingNode) this.startBattle(this.run.pendingNode);
    else if (this.loadoutReturn === 'map') { this.renderMap(); this.show('map'); }
    else if (this.loadoutReturn === 'sector') { this.renderSectors(); this.show('sector'); }
    else { this.renderHub(); this.show('hub'); }
  }

  enemyFaction() {
    return pick(this.factions.filter(faction => faction.id !== this.run.faction));
  }

  renderSectors() {
    this.galaxyScene?.destroy();
    this.galaxyScene = null;
    const map = $('#sector-map');
    map.className = 'sector-map webgl-star-map';
    const activeIndex = Number.isInteger(this.run.region) ? this.run.region : null;
    if (activeIndex !== null && this.run.sectors[activeIndex]) this.run.sectors[activeIndex].status = 'available';
    if (!this.run.sectors.some(sector => sector.status === 'available')) {
      const nextSector = this.run.sectors.find(sector => sector.status !== 'complete');
      if (nextSector) nextSector.status = 'available';
    }
    map.innerHTML = `<canvas class="galaxy-webgl" aria-hidden="true"></canvas><div class="webgl-map-labels"></div><div class="webgl-map-vignette" aria-hidden="true"></div><div class="webgl-map-readout" aria-hidden="true"><span>ASTRONOMICAN LINK</span><b>SEGMENTUM CHART</b></div><div class="chart-compass" aria-hidden="true"><i></i><b>N</b></div>`;
    const labelLayer = map.querySelector('.webgl-map-labels');
    const systems = [];
    this.run.sectors.forEach((sector,index) => {
      sector.name = SECTOR_NAMES[index] || sector.name;
      const button = document.createElement('button');
      const layout = GALAXY_SYSTEM_LAYOUT[index] || GALAXY_SYSTEM_LAYOUT.at(-1);
      button.className = `webgl-map-label sector-card ${sector.status} ${activeIndex === index ? 'active-system' : ''} ${index === 0 ? 'start-system' : ''}`;
      button.disabled = sector.status === 'locked' && activeIndex !== index;
      const status = sector.status === 'complete' ? `${sector.stars} ★ CLEARED` : this.run.region === index ? 'ACTIVE OPERATION' : sector.status === 'available' ? 'TRAVEL AVAILABLE' : 'UNCHARTED';
      button.innerHTML = `<span class="webgl-label-copy">${index === 0 ? '<mark>START POINT</mark>' : ''}<b>${sector.name}</b><small>${status}</small><em>0${index + 1}</em></span>`;
      labelLayer.append(button);
      systems.push({
        id:String(index),name:sector.name,status:sector.status,tone:layout.tone,size:layout.size,
        position:[(layout.x-50)*.18,(50-layout.y)*.24,(index%3-1)*1.8],
        locked:button.disabled,available:sector.status==='available'||activeIndex===index,button
      });
    });
    this.mountGalaxyScene({
        viewport:map,canvas:map.querySelector('.galaxy-webgl'),labelLayer,mode:'galaxy',systems,
        reducedMotion:Boolean(this.meta.settings?.reducedMotion),
        onSelect:id => this.enterSector(Number(id))
      },map);
    this.save();
  }

  async mountGalaxyScene(options,map) {
    const mountId=++this.galaxyMountId;
    try {
      const { GalaxyMap3D }=await this.galaxyModulePromise;
      if (mountId!==this.galaxyMountId || !map.isConnected) return;
      this.galaxyScene?.destroy();
      this.galaxyScene=new GalaxyMap3D(options);
    } catch (error) {
      if (mountId!==this.galaxyMountId) return;
      console.error('Unable to initialize the stellar chart',error);
      map.classList.add('webgl-fallback');
    }
  }

  enterSector(index) {
    const sector = this.run.sectors[index];
    if (!sector) return;
    if (this.run.region === index) { this.renderMap(); return this.show('map'); }
    if (sector.status === 'locked' || sector.status === 'complete') return;
    this.run.story ||= {briefed:[],completed:[],pendingBriefing:null};
    this.run.story.pendingBriefing = index;
    this.save();
    this.openMissionBriefing(index);
  }

  missionFor(index) {
    return MISSION_SCRIPTS[index] || MISSION_SCRIPTS.at(-1);
  }

  openMissionBriefing(index = this.run?.region, review = false) {
    if (!this.run || index === null || index === undefined) return;
    const mission = this.missionFor(index);
    const sector = this.run.sectors[index];
    $('#mission-kicker').textContent = `// DIRECTIVE ${String(index + 1).padStart(2,'0')} · ${sector.name}`;
    $('#mission-title').textContent = mission.title;
    $('#mission-copy').textContent = `“${mission.quote}”`;
    $('#mission-objective').textContent = mission.objective;
    $('#mission-reward').textContent = mission.reward;
    $('#mission-accept-button').textContent = review ? 'RETURN TO CHART' : 'ACCEPT DIRECTIVE';
    $('#mission-accept-button').dataset.review = review ? 'true' : 'false';
    $('#mission-belay-button').hidden = review;
    $('#mission-dialog').showModal();
  }

  closeMissionBriefing() {
    if (!$('#mission-dialog').open) return;
    $('#mission-dialog').close();
    if (this.run?.story) this.run.story.pendingBriefing = null;
    if ($('#sector-screen').classList.contains('active')) this.renderSectors();
    this.save();
  }

  acceptMission() {
    if ($('#mission-accept-button').dataset.review === 'true') return $('#mission-dialog').close();
    const index = this.run?.story?.pendingBriefing;
    if (index === null || index === undefined) return;
    $('#mission-dialog').close();
    this.run.story.pendingBriefing = null;
    if (!this.run.story.briefed.includes(index)) this.run.story.briefed.push(index);
    this.run.region = index; this.run.step = 0; this.run.sectorStars = 0; this.run.offers = null;
    this.run.history = this.run.history.filter(node => node.region !== index);
    this.save(); this.renderMap(); this.show('map');
  }

  makeOffers() {
    const r = this.run.region;
    const s = this.run.step;
    const tier = CAMPAIGN_TIERS[this.run.tierIndex];
    if (s === tier.depth) {
      const enemy = this.enemyFaction();
      const thresholds = [0,tier.depth + 1,tier.depth * 2];
      return [1,2,3].map((bossTier,lane) => ({
        id:`r${r}-boss-${bossTier}`,type:'boss',bossTier,
        name:['WARLORD','CHAMPION','APEX COMMANDER'][bossTier-1],
        reward:`${bossTier}★ · BANK ${tier.permanentReward * bossTier} REQ ON CAMPAIGN VICTORY`,
        difficulty:(1 + bossTier * .22) * tier.enemyScale, enemyFaction:enemy.id,
        locked:this.run.sectorStars < thresholds[bossTier-1], threshold:thresholds[bossTier-1], stars:bossTier,lane
      }));
    }
    const names = ['PATROL CLASH','SUPPLY RAID','LINE ENGAGEMENT','ARMOURED COLUMN','BREAKTHROUGH','VOID AMBUSH','RELIC DEFENCE'];
    return [1,2,3].map((stars,index) => {
      const eventRoll = (r * 7 + s * 3 + index) % 7;
      const event = eventRoll === 2 ? 'recruit' : eventRoll === 5 ? 'store' : null;
      const type = stars === 3 ? 'elite' : event === 'store' ? 'salvage' : 'skirmish';
      return {id:`r${r}s${s}n${index}`,type,name:names[(r+s+index)%names.length],stars,event,lane:index,
        reward:event === 'recruit' ? 'RECRUIT SIGNAL' : event === 'store' ? 'FIELD STORE' : 'POST-WAR CHOICE',
        difficulty:(.62 + stars * .14 + s * .035) * tier.enemyScale,enemyFaction:this.enemyFaction().id};
    });
  }

  renderMap() {
    this.galaxyScene?.destroy();
    this.galaxyScene = null;
    if (!this.run.offers) this.run.offers = this.makeOffers();
    const tier = CAMPAIGN_TIERS[this.run.tierIndex];
    const sector = this.run.sectors[this.run.region];
    $('#region-kicker').textContent = `SECTOR ${this.run.region + 1} / ${this.run.sectors.length} · AREA ${Math.min(this.run.step + 1,tier.depth + 1)} / ${tier.depth + 1}`;
    $('#map-title').textContent = sector.name;
    $('#map-cap').textContent = this.run.cap;
    $('#run-hull').textContent = `${this.run.hull}/${this.run.maxHull}`;
    $('#run-data').textContent = this.run.sectorStars;
    $('#run-currency').textContent = this.run.currency;
    $('#run-protocol-count').textContent = this.run.protocols.length;
    const mission = this.missionFor(this.run.region);
    $('#mission-strip-title').textContent = mission.title;
    $('#mission-strip-progress').textContent = `${Math.min(this.run.step, tier.depth)} / ${tier.depth} TARGETS · ${this.run.sectorStars} ★`;
    const map = $('#route-map');
    map.className = 'route-map area-galaxy star-system-map webgl-star-map local-webgl-map';
    map.innerHTML = `<canvas class="galaxy-webgl" aria-hidden="true"></canvas><div class="webgl-map-labels"></div><div class="webgl-map-vignette" aria-hidden="true"></div><div class="webgl-map-readout local" aria-hidden="true"><span>LOCAL CARTOGRAPHY</span><b>${sector.name}</b></div>`;
    const labelLayer = map.querySelector('.webgl-map-labels');
    const systems = [{id:'__core',name:sector.name,tone:'gold',size:1.25,position:[-1.2,.2,-2.5],locked:true,primary:true}];
    this.run.offers.forEach((node,offerIndex) => {
      const layout = SYSTEM_DESTINATION_LAYOUT[offerIndex];
      const choice = this.makeNodeButton(node,`webgl-map-label available ${node.type}`,true,true);
      labelLayer.append(choice);
      systems.push({
        id:node.id,name:node.name,tone:layout.tone,size:layout.size,
        position:[(layout.x-50)*.15,(50-layout.y)*.18,(offerIndex-1)*1.5],
        locked:Boolean(node.locked),available:!node.locked,button:choice
      });
    });
    this.mountGalaxyScene({
        viewport:map,canvas:map.querySelector('.galaxy-webgl'),labelLayer,mode:'local',systems,
        reducedMotion:Boolean(this.meta.settings?.reducedMotion),
        onSelect:id => {
          const node=this.run.offers.find(offer=>offer.id===id);
          if (node) this.chooseNode(node);
        }
      },map);
    this.save();
  }

  makeNodeButton(node, classes, active, deferToScene = false) {
    const button = document.createElement('button');
    button.className = `route-node ${classes}`;
    const labels = {skirmish:'BATTLE',elite:'ELITE',salvage:'SUPPLY',repair:'RECOVERY',boss:'SECTOR BOSS',closed:'UNKNOWN'};
    const faction = node.enemyFaction ? this.faction(node.enemyFaction).name : labels[node.type];
    const rewardIcon = node.type === 'boss' ? '♜' : node.type === 'repair' ? '♥' : node.type === 'elite' ? '✦' : node.type === 'salvage' ? '⚙' : '◆';
    button.innerHTML = `<b>${rewardIcon} ${node.name}</b><small>${faction}${node.stars ? ` · ${'★'.repeat(node.stars)}` : ''}</small><span>${node.locked ? `NEEDS ${node.threshold} ★` : node.reward || ''}</span>`;
    button.disabled = !active || node.locked;
    if (active && !node.locked && !deferToScene) button.onclick = () => {
      if (button.dataset.engaging) return;
      if (document.body.classList.contains('reduced-motion')) return this.chooseNode(node);
      button.dataset.engaging = 'true'; button.classList.add('engaging');
      $('#route-map').classList.add('zone-engaging');
      setTimeout(() => this.chooseNode(node), 340);
    };
    return button;
  }

  chooseNode(node) {
    this.run.pendingNode = node;
    this.save();
    this.openLoadout();
  }

  buildFighter(placed, side = 'player') {
    const unit = this.unit(placed.unitId);
    const fighter = {
      ...unit, instanceId:placed.id, side, x:placed.x ?? 0, y:placed.y ?? 0, attachedTo:placed.attachedTo || null,
      toughness:unit.defense.toughness, save:unit.defense.save, invuln:unit.defense.invuln,
      hitBonus:0, woundBonus:0, saveBonus:0, attacksBonus:0, fnp:7,
      hp:Array(unit.models).fill(unit.defense.wounds), maxHp:unit.models * unit.defense.wounds,
      currentHp:unit.models * unit.defense.wounds, dead:false
    };
    if (side === 'player') {
      const gearItem = this.run.gear.find(item => item.equippedTo === placed.id);
      if (gearItem) {
        const gear = WARGEAR.find(item => item.id === gearItem.gearId);
        if (gear.stat === 'toughness') fighter.toughness += gear.value;
        else if (gear.stat === 'invuln') fighter.invuln = Math.min(fighter.invuln, gear.value);
        else fighter[gear.stat] += gear.value;
      }
      const effects = this.protocolEffects();
      fighter.hitBonus += effects.hitBonus || 0;
      fighter.woundBonus += effects.woundBonus || 0;
      fighter.saveBonus += effects.saveBonus || 0;
      fighter.invuln = Math.min(fighter.invuln, effects.invuln || 7);
      fighter.fnp = effects.fnp || 7;
      const doctrine = this.meta.research.doctrine || 0;
      if (doctrine >= 1) fighter.hitBonus++;
      if (doctrine >= 2) fighter.woundBonus++;
      if (doctrine >= 3) fighter.fnp = Math.min(fighter.fnp, 6);
    }
    fighter.baseInvuln = fighter.invuln;
    return fighter;
  }

  makeEnemyForce(node) {
    const pool = this.units.filter(unit => unit.faction === node.enemyFaction && unit.points <= this.run.cap && !unit.leader);
    const target = Math.max(150, Math.round(this.usedPoints() * node.difficulty));
    const force = [];
    let total = 0, safety = 0;
    while (total < target * .85 && safety++ < 20) {
      const choices = pool.filter(unit => unit.points <= target - total + 80);
      const unit = pick(choices.length ? choices : pool);
      force.push(this.buildFighter({id:`enemy-${force.length}`,unitId:unit.id,x:force.length%3,y:Math.floor(force.length/3)}, 'enemy'));
      total += unit.points;
    }
    if (node.type === 'boss' && force[0]) {
      force[0].name = node.name;
      force[0].hp = force[0].hp.map(value => Math.ceil(value * (1.25 + (node.bossTier || 1) * .2)));
      force[0].maxHp = force[0].hp.reduce((sum,value) => sum + value, 0);
      force[0].currentHp = force[0].maxHp;
      force[0].attacksBonus += 1;
    }
    return force;
  }

  startBattle(node) {
    const players = this.run.deployed.map(placed => this.buildFighter(placed));
    for (const leader of players.filter(unit => unit.attachedTo)) {
      const bodyguard = players.find(unit => unit.instanceId === leader.attachedTo);
      if (bodyguard) {
        leader.protectedBy = bodyguard;
        bodyguard.leaderGrant = leader.leader?.grant || {};
      }
    }
    const enemies = this.makeEnemyForce(node);
    this.battle = {
      node, players, enemies, round:0,
      log:[`⚔ ${this.faction(node.enemyFaction).name}`],
      resolving:false, lastRoll:null, visibleStage:-1, actors:[], actorIndex:0, currentPlan:null,
      cp:{player:1 + (this.stratagemEffects().startingCp || 0),enemy:1}, insaneBravery:{player:false,enemy:false}, stratagemUsed:{player:false,enemy:false}, oathTarget:{player:null,enemy:null},
      shadowUsed:{player:false,enemy:false}, rangeBand:'LONG RANGE'
    };
    this.battleSpeed = 1;
    $('#speed-button').textContent = 'SPEED ×1';
    $('#battle-title').textContent = node.name;
    $('#battle-kicker').textContent = node.type === 'boss' ? '// ♜ BOSS · AUTO-D6' : '// ⚄ AUTO-BATTLE';
    $('#player-power').textContent = `${this.usedPoints()} PTS`;
    $('#enemy-power').textContent = `${this.faction(node.enemyFaction).name.toUpperCase()} · THREAT ${Math.round(node.difficulty*100)}`;
    this.setupBattleStage(node.enemyFaction);
    this.show('battle');
    this.renderBattle();
    this.scheduleRound();
  }

  stratagemEffects() {
    const effects = {};
    for (const id of this.run.stratagems || []) {
      const effect = STRATAGEMS.find(item => item.id === id)?.effect || {};
      for (const [key,value] of Object.entries(effect)) effects[key] = (effects[key] || 0) + value;
    }
    return effects;
  }

  scheduleRound() {
    clearTimeout(this.battleTimer);
    this.battleTimer = setTimeout(() => this.beginAnimatedRound(), this.battleSpeed === 1 ? 900 : 320);
  }

  alive(force) { return force.filter(unit => !unit.dead); }

  runRound(render = true) {
    if (!this.battle || this.battle.resolving) return;
    this.battle.round++;
    this.commandPhase();
    const actors = shuffle([...this.alive(this.battle.players), ...this.alive(this.battle.enemies)]);
    for (const actor of actors) {
      if (actor.dead) continue;
      const foes = actor.side === 'player' ? this.battle.enemies : this.battle.players;
      if (!this.alive(foes).length) break;
      const target = this.chooseTarget(this.alive(foes), actor.side);
      const plan = this.prepareDiceAttack(actor, target);
      this.applyDiceAttack(plan);
    }
    const regen = this.protocolEffects().regen || 0;
    if (regen) for (const unit of this.alive(this.battle.players)) this.restoreWounds(unit, regen);
    if (render) this.renderBattle();
    if (!this.alive(this.battle.enemies).length) return this.finishBattle(true);
    if (!this.alive(this.battle.players).length || this.battle.round >= 30) return this.finishBattle(false);
    if (render) this.scheduleRound();
  }

  beginAnimatedRound() {
    if (!this.battle || this.battle.resolving) return;
    if (!this.alive(this.battle.enemies).length) return this.finishBattle(true);
    if (!this.alive(this.battle.players).length || this.battle.round >= 30) return this.finishBattle(false);
    this.battle.round++;
    this.commandPhase();
    this.battle.actors = shuffle([...this.alive(this.battle.players), ...this.alive(this.battle.enemies)]);
    this.battle.actorIndex = 0;
    this.battle.currentPlan = null;
    this.battle.visibleStage = -1;
    this.renderBattle();
    this.nextAnimatedActor();
  }

  stageDelay() { return this.battleSpeed === 1 ? 520 : 190; }

  nextAnimatedActor() {
    if (!this.battle || this.battle.resolving) return;
    let actor = this.battle.actors[this.battle.actorIndex++];
    while (actor?.dead) actor = this.battle.actors[this.battle.actorIndex++];
    if (!actor) return this.endAnimatedRound();
    const foes = actor.side === 'player' ? this.battle.enemies : this.battle.players;
    if (!this.alive(foes).length) return this.endAnimatedRound();
    const target = this.chooseTarget(this.alive(foes), actor.side);
    this.battle.currentPlan = this.prepareDiceAttack(actor, target);
    this.battle.lastRoll = this.battle.currentPlan;
    this.battle.visibleStage = 0;
    this.fireBattleBeam(actor.side);
    this.renderBattle();
    clearTimeout(this.battleTimer);
    this.battleTimer = setTimeout(() => this.advanceDiceStage(), this.stageDelay());
  }

  advanceDiceStage() {
    if (!this.battle || this.battle.resolving || !this.battle.currentPlan) return;
    if (this.battle.visibleStage < 4) {
      this.battle.visibleStage++;
      if (this.battle.visibleStage === 4) this.applyDiceAttack(this.battle.currentPlan);
      this.renderBattle();
      this.battleTimer = setTimeout(() => this.advanceDiceStage(), this.stageDelay());
      return;
    }
    this.battle.currentPlan = null;
    this.battleTimer = setTimeout(() => this.nextAnimatedActor(), this.battleSpeed === 1 ? 360 : 110);
  }

  endAnimatedRound() {
    const regen = this.protocolEffects().regen || 0;
    if (regen) for (const unit of this.alive(this.battle.players)) this.restoreWounds(unit, regen);
    this.renderBattle();
    if (!this.alive(this.battle.enemies).length) return this.finishBattle(true);
    if (!this.alive(this.battle.players).length || this.battle.round >= 30) return this.finishBattle(false);
    this.scheduleRound();
  }

  chooseTarget(foes, side) {
    const legal = foes.filter(unit => !unit.protectedBy || unit.protectedBy.dead);
    const pool = legal.length ? legal : foes;
    if (side === 'enemy') return [...pool].sort((a,b) => a.x - b.x || a.currentHp - b.currentHp)[0];
    return [...pool].sort((a,b) => a.currentHp - b.currentHp)[0];
  }

  commandPhase() {
    const battle = this.battle;
    battle.cp.player = Math.min(5, battle.cp.player + 1);
    battle.cp.enemy = Math.min(5, battle.cp.enemy + 1);
    battle.rangeBand = battle.round >= 2 ? 'HALF RANGE' : 'LONG RANGE';
    battle.stratagemUsed = {player:false,enemy:false};
    for (const unit of [...this.alive(battle.players), ...this.alive(battle.enemies)]) {
      unit.battleShocked = false;
      unit.invuln = unit.baseInvuln;
    }
    for (const side of ['player','enemy']) {
      const force = side === 'player' ? battle.players : battle.enemies;
      for (const unit of this.alive(force)) if (this.belowHalfStrength(unit)) this.testBattleShock(unit);
    }
    for (const side of ['player','enemy']) {
      const force = side === 'player' ? battle.players : battle.enemies;
      const foes = side === 'player' ? battle.enemies : battle.players;
      if (this.alive(force).some(unit => unit.keywords?.includes('Adeptus Astartes'))) {
        const previousOath = battle.oathTarget[side];
        battle.oathTarget[side] = [...this.alive(foes)].sort((a,b) => b.currentHp - a.currentHp)[0]?.instanceId || null;
        const oath = this.alive(foes).find(unit => unit.instanceId === battle.oathTarget[side]);
        if (oath && previousOath !== battle.oathTarget[side]) this.addLog(`◎ ${oath.name}`);
      }
      if (this.alive(force).some(unit => unit.abilities?.includes('Da Boss'))) battle.cp[side] = Math.min(5, battle.cp[side] + 1);
      if (!battle.shadowUsed[side] && battle.round === 2 && this.alive(force).some(unit => unit.abilities?.includes('Shadow in the Warp'))) {
        battle.shadowUsed[side] = true;
        this.addLog(`⌁ SHADOW · ${side === 'player' ? 'ENEMY' : 'PLAYER'} TEST`);
        for (const unit of this.alive(foes)) this.testBattleShock(unit, true);
      }
      if (battle.round === 2 && this.alive(force).some(unit => unit.abilities?.includes('Waaagh!'))) {
        for (const unit of this.alive(force)) if (unit.keywords?.includes('Orks')) unit.invuln = Math.min(unit.invuln, 5);
        this.addLog(`! WAAAGH · ${side === 'player' ? 'PLAYER' : 'ENEMY'}`);
      }
    }
  }

  belowHalfStrength(unit) {
    if (unit.models === 1) return unit.currentHp < unit.maxHp / 2;
    return unit.hp.length < Math.ceil(unit.models / 2);
  }

  testBattleShock(unit, forced = false) {
    const synapse = unit.keywords?.includes('Synapse');
    const dice = Array.from({length:synapse ? 3 : 2}, unit.side === 'player' ? playerD6 : d6);
    const total = dice.reduce((sum,value) => sum + value, 0);
    const failed = total < (unit.leadership || 7);
    if (!failed) return;
    const side = unit.side;
    if (!forced && !this.battle.insaneBravery[side] && this.battle.cp[side] > 0) {
      this.battle.cp[side]--;
      this.battle.insaneBravery[side] = true;
      this.addLog(`◆ BRAVERY · ${unit.name} · −1CP`);
      return;
    }
    unit.battleShocked = true;
    this.addLog(`☠ SHOCK · ${unit.name} · ${dice.join('+')}<${unit.leadership}`);
  }

  prepareDiceAttack(actor, target) {
    const models = actor.hp.length;
    const halfRange = this.battle.round >= 2 && actor.weapon.range > 0;
    const rules = weaponRules(actor.weapon, halfRange);
    const leader = actor.leaderGrant || {};
    const attackDice = [];
    let attacks = 0;
    for (let model = 0; model < models; model++) {
      const roll = rollExpression(actor.weapon.attacks, actor.side === 'player');
      attackDice.push(...roll.rolls);
      attacks += roll.total + actor.attacksBonus;
      if (rules.rapidFire) {
        const rapid = rollExpression(rules.rapidFire, actor.side === 'player');
        attackDice.push(...rapid.rolls);
        attacks += rapid.total;
      }
      if (rules.blast) attacks += Math.floor(target.hp.length / 5) * rules.blast;
    }
    const effects = actor.side === 'player' ? this.protocolEffects() : {};
    const tactics = actor.side === 'player' && this.battle.round === 1 ? this.stratagemEffects() : {};
    attacks += models * (tactics.openingAttacks || 0);
    const hitTarget = clamp(actor.weapon.hit - actor.hitBonus - (tactics.openingHit || 0), 2, 6);
    const attackDie = actor.side === 'player' ? playerD6 : d6;
    const saveDie = target.side === 'player' ? playerD6 : d6;
    let hitRolls = rules.torrent ? [] : Array.from({length:attacks}, attackDie);
    const oathReroll = target.instanceId === this.battle.oathTarget[actor.side];
    if (!rules.torrent && (oathReroll || leader.hitReroll === 'failed')) hitRolls = hitRolls.map(roll => roll !== 1 && roll >= hitTarget ? roll : attackDie());
    if (!rules.torrent && !oathReroll && leader.hitReroll !== 'failed') hitRolls = this.commandReroll(actor, hitRolls, hitTarget, 'Hit');
    let hits = rules.torrent ? attacks : hitRolls.filter(roll => roll !== 1 && roll >= hitTarget).length;
    const criticalHits = hitRolls.filter(roll => roll === 6).length;
    const tacticalAutoWounds = tactics.openingAutoWound ? hitRolls.filter(roll => roll !== 1 && roll >= tactics.openingAutoWound).length : 0;
    const autoWounds = tacticalAutoWounds || (effects.lethalHits || rules.lethalHits ? criticalHits : 0);
    const sustainedHits = Math.max(effects.sustainedHits || 0, rules.sustainedHits || 0, leader.sustainedHits || 0);
    if (sustainedHits) hits += criticalHits * sustainedHits;
    const woundNeeded = clamp(woundTarget(actor.weapon.strength, target.toughness) - actor.woundBonus - (tactics.openingWound || 0), 2, 6);
    const antiNeeded = target.keywords?.includes('Infantry') ? rules.antiInfantry : target.keywords?.includes('Monster') ? rules.antiMonster : target.keywords?.includes('Vehicle') ? rules.antiVehicle : null;
    const effectiveWoundNeeded = Math.min(woundNeeded, antiNeeded || 7);
    let woundRolls = Array.from({length:Math.max(0,hits-autoWounds)}, attackDie);
    if (rules.woundReroll === 'failed') woundRolls = woundRolls.map(roll => roll !== 1 && roll >= effectiveWoundNeeded ? roll : attackDie());
    if (rules.woundReroll !== 'failed') woundRolls = this.commandReroll(actor, woundRolls, effectiveWoundNeeded, 'Wound');
    const rolledWounds = woundRolls.filter(roll => roll !== 1 && roll >= effectiveWoundNeeded).length;
    const wounds = rolledWounds + autoWounds;
    const criticalWoundNeeded = antiNeeded || 6;
    const devastating = rules.devastatingWounds ? woundRolls.filter(roll => roll !== 1 && roll >= criticalWoundNeeded).length : 0;
    const armourTarget = clamp(target.save - actor.weapon.ap - target.saveBonus, 2, 7);
    const defendingTactics = target.side === 'player' && this.battle.round === 1 ? this.stratagemEffects() : {};
    const saveTarget = Math.min(armourTarget, target.invuln || 7, defendingTactics.openingInvuln || 7);
    let saveRolls = Array.from({length:Math.max(0,wounds-devastating)}, saveDie);
    saveRolls = this.commandReroll(target, saveRolls, saveTarget, 'Save');
    const saves = saveRolls.filter(roll => saveTarget <= 6 && roll >= saveTarget).length;
    const unsaved = wounds - saves;
    const damageRolls = [];
    let damageLost = 0;
    const remainingHp = [...target.hp];
    for (let i = 0; i < unsaved && remainingHp.length; i++) {
      const result = rollExpression(actor.weapon.damage, actor.side === 'player');
      damageRolls.push(...(result.rolls.length ? result.rolls : [result.total]));
      let damage = result.total;
      if (rules.melta) damage += rules.melta;
      if (target.fnp <= 6) {
        const ignored = Array.from({length:damage}, saveDie).filter(roll => roll >= target.fnp).length;
        damage -= ignored;
      }
      const lost = Math.min(remainingHp[0], damage);
      remainingHp[0] -= lost;
      damageLost += lost;
      if (remainingHp[0] <= 0) remainingHp.shift();
    }
    const ruleNotes = [tactics.openingAttacks ? `Orbital Mark +${models * tactics.openingAttacks} attacks` : '', tacticalAutoWounds ? `Auspex ${tacticalAutoWounds} automatic wound${tacticalAutoWounds === 1 ? '' : 's'}` : '', defendingTactics.openingInvuln ? `Aegis ${defendingTactics.openingInvuln}+ ward` : '', halfRange && rules.rapidFire ? `Rapid Fire +${rules.rapidFire}` : '', rules.blast ? `Blast +${Math.floor(target.hp.length/5)*rules.blast}A/model` : '', rules.torrent ? 'Torrent: automatic hits' : '', rules.woundReroll ? 'Twin-linked wound re-rolls' : '', antiNeeded ? `Anti-${target.keywords.includes('Infantry') ? 'Infantry' : target.keywords.includes('Monster') ? 'Monster' : 'Vehicle'} ${antiNeeded}+` : '', devastating ? `${devastating} Devastating Wound${devastating === 1 ? '' : 's'}` : '', rules.melta ? `Melta +${rules.melta} damage` : '', sustainedHits ? `Sustained Hits ${sustainedHits}` : '', !tacticalAutoWounds && autoWounds ? `${autoWounds} Lethal Hit${autoWounds === 1 ? '' : 's'}` : ''].filter(Boolean);
    return {actor:actor.name,target:target.name,actorRef:actor,targetRef:target,attacks,attackDice,hitRolls,hitTarget,hits,woundRolls,woundNeeded:effectiveWoundNeeded,wounds,saveRolls,saveTarget,saves,damageRolls,damageLost,remainingHp,devastating,lethal:autoWounds,ruleNotes,applied:false};
  }

  commandReroll(unit, rolls, target, label) {
    if (!rolls.length || target > 6 || unit.battleShocked || this.battle.cp[unit.side] < 1 || this.battle.stratagemUsed[unit.side]) return rolls;
    const index = rolls.findIndex(roll => roll === 1 || roll < target);
    if (index < 0) return rolls;
    const next = [...rolls];
    next[index] = unit.side === 'player' ? playerD6() : d6();
    this.battle.cp[unit.side]--;
    this.battle.stratagemUsed[unit.side] = true;
    this.addLog(`↻ ${label.toUpperCase()} · ${unit.name} · −1CP`);
    return next;
  }

  applyDiceAttack(plan) {
    if (!plan || plan.applied) return;
    const target = plan.targetRef;
    target.hp = [...plan.remainingHp];
    target.currentHp = target.hp.reduce((sum,value) => sum + value, 0);
    target.dead = target.hp.length === 0;
    if (target.dead) target.deathEffectUntil = performance.now() + 900;
    target.flash = 'hit';
    plan.applied = true;
    this.battle.lastRoll = plan;
    if (target.dead) this.addLog(`✕ ${target.name}`);
    this.triggerBattleImpact(plan);
  }

  restoreWounds(unit, amount) {
    if (!unit.hp.length) return;
    const max = unit.defense.wounds;
    unit.hp[0] = Math.min(max, unit.hp[0] + amount);
    unit.currentHp = unit.hp.reduce((sum,value) => sum + value, 0);
    unit.flash = 'heal';
  }

  addLog(message) {
    this.battle.log.unshift(message);
    this.battle.log = this.battle.log.slice(0, 3);
  }

  renderBattle() {
    $('#round-value').textContent = this.battle.round;
    this.renderForce($('#enemy-field'), this.battle.enemies);
    this.renderForce($('#player-field'), this.battle.players);
    $('#battle-log').innerHTML = this.battle.log.map(line => `<div>› ${line}</div>`).join('');
    $('#player-cp').textContent = this.battle.cp.player;
    $('#enemy-cp').textContent = this.battle.cp.enemy;
    $('#range-band').textContent = this.battle.rangeBand;
    this.renderDice();
  }

  renderForce(container, force) {
    container.innerHTML = '';
    for (const fighter of force) {
      const el = document.createElement('div');
      const destroying = fighter.dead && performance.now() < (fighter.deathEffectUntil || 0);
      el.className = `fighter ${fighter.dead ? 'dead' : ''} ${destroying ? 'destroying' : ''} ${fighter.flash || ''}`;
      el.style.setProperty('--fighter-color', fighter.side === 'enemy' ? '#ff496c' : fighter.color);
      const states = [fighter.battleShocked ? 'BATTLE-SHOCKED' : '', fighter.attachedTo ? 'LEADER' : '', fighter.protectedBy && !fighter.protectedBy.dead ? `ATTACHED TO ${fighter.protectedBy.name}` : ''].filter(Boolean).join(' · ');
      el.innerHTML = `<b>${fighter.name}</b><small>${fighter.hp.length}/${fighter.models} models · T${fighter.toughness} · SV${fighter.save}+${states ? `<br>${states}` : ''}</small><div class="hp"><i style="width:${clamp(fighter.currentHp/fighter.maxHp*100,0,100)}%"></i></div>`;
      container.append(el);
      fighter.flash = '';
    }
  }

  diceHTML(rolls, target, critical = false, damage = false) {
    if (!rolls.length) return '<span class="die pass">—</span>';
    return rolls.slice(0,18).map(roll => {
      const pass = damage || (roll !== 1 && roll >= target);
      return `<span class="die ${pass ? 'pass' : 'fail'} ${critical && roll === 6 ? 'critical' : ''} ${damage ? 'damage-die' : ''}">${roll}</span>`;
    }).join('');
  }

  renderDice() {
    const tray = $('#dice-tray');
    const roll = this.battle.lastRoll;
    if (!roll) { tray.innerHTML = '<span class="dice-empty">WAITING FOR FIRST DICE ROLL</span>'; return; }
    const visible = this.battle.visibleStage < 0 ? 4 : this.battle.visibleStage;
    const stage = (index, label, dice, result) => `<div class="dice-stage ${index <= visible ? 'revealed' : 'waiting'} ${index === visible ? 'current' : ''}"><div class="stage-heading"><small>${label}</small><b>${result}</b></div><div class="dice-pool">${dice}</div></div>`;
    tray.innerHTML = `<div class="dice-caption"><span>${roll.actor}</span><span>${roll.target}</span></div><div class="dice-sequence">
      ${stage(0,'01 · ATTACKS',this.diceHTML(roll.attackDice,1,false,true),`${roll.attacks} TOTAL`)}
      ${stage(1,`02 · HIT · ${roll.hitTarget}+`,this.diceHTML(roll.hitRolls,roll.hitTarget,true),`${roll.hits} HITS`)}
      ${stage(2,`03 · WOUND · ${roll.woundNeeded}+`,this.diceHTML(roll.woundRolls,roll.woundNeeded,true),`${roll.wounds} WOUNDS`)}
      ${stage(3,`04 · SAVE · ${roll.saveTarget <= 6 ? `${roll.saveTarget}+` : 'NONE'}`,this.diceHTML(roll.saveRolls,roll.saveTarget),`${roll.saves} SAVED`)}
      ${stage(4,'05 · DAMAGE',this.diceHTML(roll.damageRolls,1,false,true),`${roll.damageLost} LOST`)}
    </div>${roll.ruleNotes?.length ? `<div class="rule-notes">${roll.ruleNotes.join(' · ')}</div>` : ''}<div class="dice-outcome ${visible === 4 ? 'revealed' : ''}">${visible === 4 ? `${roll.damageLost} WOUNDS INFLICTED${roll.remainingHp.length ? '' : ' · UNIT DESTROYED'}` : 'RESOLUTION IN PROGRESS'}</div>`;
  }

  toggleSpeed() {
    if (!this.battle) return;
    this.battleSpeed = this.battleSpeed === 1 ? 2 : 1;
    $('#speed-button').textContent = `SPEED ×${this.battleSpeed}`;
  }

  resolveBattleNow() {
    if (!this.battle || this.battle.resolving) return;
    clearTimeout(this.battleTimer);
    if (this.battle.currentPlan) this.applyDiceAttack(this.battle.currentPlan);
    while (this.battle.actorIndex < this.battle.actors.length && this.alive(this.battle.players).length && this.alive(this.battle.enemies).length) {
      const actor = this.battle.actors[this.battle.actorIndex++];
      if (actor.dead) continue;
      const foes = actor.side === 'player' ? this.battle.enemies : this.battle.players;
      if (!this.alive(foes).length) break;
      this.applyDiceAttack(this.prepareDiceAttack(actor, this.chooseTarget(this.alive(foes), actor.side)));
    }
    let safety = 30;
    while (this.alive(this.battle.players).length && this.alive(this.battle.enemies).length && this.battle.round < 30 && safety-- > 0) this.runRound(false);
    this.battle.visibleStage = 4;
    this.renderBattle();
    this.finishBattle(this.alive(this.battle.enemies).length === 0);
  }

  finishBattle(victory) {
    if (!this.battle || this.battle.resolving) return;
    clearTimeout(this.battleTimer);
    this.battle.resolving = true;
    const node = this.battle.node;
    const defeatedSide = victory ? 'enemy' : 'player';
    $(`.battle-wing-${defeatedSide}`).classList.add('defeated');
    $('#desktop-battle-stage').classList.add('battle-concluded');
    this.renderBattle();
    setTimeout(() => {
      if (victory) this.openRewards(node);
      else this.handleDefeat(node);
      this.battle = null;
    }, 1100);
  }

  openRewards(node) {
    const score = node.type === 'boss' ? 90 * (node.bossTier || 1) : 20 + node.stars * 10;
    this.run.data += score;
    this.run.stars += node.stars || 0;
    this.run.sectorStars += node.stars || 0;
    this.run.battles++;
    if (node.type === 'boss') this.run.bosses++;
    const req = Math.round((18 + (node.stars || 1) * 8) * (1 + (this.meta.research.salvage || 0) * .15));
    this.run.rewardContext = {node, req};
    this.ensureRewardState(this.run.rewardContext);
    this.renderRewardSegments();
    $('#reward-data').textContent = `+${node.stars || 0} ★`;
    $('#reward-gear-line').textContent = `${score} CAMPAIGN SCORE`;
    this.save();
    this.show('reward');
  }

  ensureRewardState(context) {
    const node = context.node;
    const stars = clamp(node.stars || 1, 1, 3);
    const total = clamp(2 + stars + (node.type === 'boss' || node.event ? 1 : 0), 3, 5);
    if (context.rewardVersion !== 2) {
      const previous = context.claimed || {};
      context.claims = {currency:1, honour:1, stratagem:1, gear:total >= 4 ? 1 : 0, recovery:total >= 5 ? 1 : 0};
      context.claimed = {
        currency:Math.min(previous.currency || 0, 1), honour:Math.min(previous.honour || 0, 1),
        stratagem:Math.min(previous.stratagem || 0, 1), gear:0, recovery:0
      };
      context.rewardVersion = 2;
    }
    context.honours ||= shuffle(BATTLE_HONOURS.filter(item => !this.run.protocols.includes(item.id))).map(item => item.id);
    context.stratagems ||= shuffle(STRATAGEMS.filter(item => !this.run.stratagems.includes(item.id))).map(item => item.id);
    context.wargear ||= shuffle(WARGEAR).map(item => item.id);
    context.totalClaims = Object.values(context.claims).reduce((sum,value) => sum + value, 0);
    return context;
  }

  rewardRemaining(kind) {
    const context = this.ensureRewardState(this.run.rewardContext);
    return Math.max(0, (context.claims[kind] || 0) - (context.claimed[kind] || 0));
  }

  rewardClaimsRemaining() {
    const context = this.ensureRewardState(this.run.rewardContext);
    return Object.keys(context.claims).reduce((sum,kind) => sum + this.rewardRemaining(kind), 0);
  }

  rewardSegmentOptions(context) {
    return [
      {kind:'currency',icon:'◆',name:'REQUISITION',tag:`CLAIM ${context.req}`,desc:'Secure campaign currency for a future field store.'},
      {kind:'honour',icon:'✦',name:'ENHANCEMENTS',tag:'CHOOSE 1 OF 3',desc:'Select a permanent enhancement for this campaign.'},
      {kind:'stratagem',icon:'⌖',name:'STRATAGEMS',tag:'CHOOSE 1 OF 3',desc:'Select a situational command tactic.'},
      {kind:'gear',icon:'⚙',name:'WARGEAR CACHE',tag:'CHOOSE 1 OF 3',desc:'Recover one item that can be assigned to a deployed unit.'},
      {kind:'recovery',icon:'♥',name:'FORCE RECOVERY',tag:this.run.hull < this.run.maxHull ? 'RESTORE 1 ATTEMPT' : 'FULL STRENGTH · +10 REQ',desc:'Restore campaign strength after a high-risk victory.'}
    ].filter(option => context.claims[option.kind]);
  }

  renderRewardSegments() {
    const context = this.ensureRewardState(this.run.rewardContext);
    const options = this.rewardSegmentOptions(context);
    const remaining = this.rewardClaimsRemaining();
    const resolved = context.totalClaims - remaining;
    $('#reward-title').textContent = 'POST-WAR AFFAIRS';
    $('#reward-copy').textContent = remaining ? `${resolved} / ${context.totalClaims} AFFAIRS RESOLVED · CLEAR ALL LOOT TO CONTINUE` : 'ALL LOOT SECURED · THE ROUTE IS OPEN';
    const list = $('#reward-options'); list.innerHTML = '';
    for (const option of options) {
      const left = this.rewardRemaining(option.kind);
      if (!left) continue;
      const button = document.createElement('button');
      button.className = 'reward-option pixel-panel';
      button.title = option.desc;
      button.setAttribute('aria-label', `${option.name}: ${option.desc}`);
      button.innerHTML = `<b>${option.icon} ${option.name}</b><small>${option.desc}</small><span>${option.tag}</span>`;
      button.onclick = () => this.selectPostWarSegment(option.kind);
      list.append(button);
    }
    $('#reward-continue-button').hidden = remaining !== 0;
    $('#reward-continue-button').onclick = () => this.completePostWarSegment();
    this.save();
  }

  selectPostWarSegment(kind) {
    const context = this.run.rewardContext; if (!context) return;
    if (!this.rewardRemaining(kind)) return;
    if (kind === 'currency') {
      this.run.currency += context.req;
      context.claimed.currency++;
      this.save();
      return this.renderRewardSegments();
    }
    if (kind === 'recovery') {
      if (this.run.hull < this.run.maxHull) this.run.hull++;
      else this.run.currency += 10;
      context.claimed.recovery++;
      return this.renderRewardSegments();
    }
    const source = kind === 'honour' ? BATTLE_HONOURS : kind === 'stratagem' ? STRATAGEMS : WARGEAR;
    const owned = kind === 'honour' ? this.run.protocols : kind === 'stratagem' ? this.run.stratagems : [];
    const key = kind === 'honour' ? 'honours' : kind === 'stratagem' ? 'stratagems' : 'wargear';
    let ids = context[key].filter(id => !owned.includes(id));
    if (!ids.length) {
      this.run.currency += 10;
      context.claimed[kind]++;
      return this.renderRewardSegments();
    }
    context[key] = ids;
    ids = ids.slice(0,3);
    const choiceName = kind === 'honour' ? 'ENHANCEMENT' : kind === 'stratagem' ? 'STRATAGEM' : 'WARGEAR';
    $('#reward-title').textContent = `CHOOSE ${choiceName === 'ENHANCEMENT' ? 'AN' : 'A'} ${choiceName}`;
    $('#reward-copy').textContent = `ONE ${choiceName} MAY BE SECURED`;
    const list = $('#reward-options'); list.innerHTML = '';
    ids.forEach(id => {
      const item = source.find(entry => entry.id === id); const button = document.createElement('button');
      button.className = 'reward-option pixel-panel'; button.title = item.desc;
      const symbol = kind === 'honour' ? ruleSymbol(`${item.name} ${item.tag}`) : kind === 'stratagem' ? '⌖' : '⚙';
      button.innerHTML = `<b>${symbol} ${item.name}</b><small>${item.desc}</small><span>${kind === 'gear' ? 'RECOVERED WARGEAR' : item.tag}</span>`;
      button.onclick = () => this.claimPostWarChoice(kind,id); list.append(button);
    });
    const back = document.createElement('button');
    back.className = 'reward-back'; back.textContent = '← POST-WAR AFFAIRS';
    back.onclick = () => this.renderRewardSegments(); list.append(back);
    $('#reward-continue-button').hidden = true;
  }

  claimPostWarChoice(kind,id) {
    if (kind === 'honour' && !this.run.protocols.includes(id)) this.run.protocols.push(id);
    if (kind === 'stratagem' && !this.run.stratagems.includes(id)) {
      this.run.stratagems.push(id);
      this.run.currency += STRATAGEMS.find(item => item.id === id)?.effect.currency || 0;
    }
    if (kind === 'gear') this.run.gear.push({gearId:id,equippedTo:null,id:`${id}-${Date.now()}`});
    this.run.rewardContext.claimed[kind]++;
    this.save();
    this.renderRewardSegments();
  }

  completePostWarSegment() {
    const node = this.run.rewardContext?.node; if (!node) return;
    if (this.rewardClaimsRemaining()) return this.renderRewardSegments();
    this.run.history.push({...node,region:this.run.region,step:this.run.step});
    this.run.pendingNode = null;
    this.run.pendingPostWar = {node,wasBoss:node.type === 'boss'};
    this.run.rewardContext = null;
    this.save();
    if (node.event === 'recruit') return this.openRecruitEvent();
    if (node.event === 'store') return this.openStoreEvent();
    this.finishPostWarEvent();
  }

  openRecruitEvent() {
    const locked = this.units.filter(unit => unit.faction === this.run.faction && !this.run.unlockedUnits.includes(unit.id));
    if (!locked.length) { this.run.currency += 25; return this.finishPostWarEvent(); }
    $('#event-kicker').textContent = '// POST-WAR · REINFORCEMENTS'; $('#event-title').textContent = 'CHOOSE A UNIT';
    $('#event-copy').textContent = 'A surviving detachment answers your command signal.';
    const list = $('#event-options'); list.innerHTML = '';
    locked.forEach(unit => {
      const button = document.createElement('button'); button.className = 'event-card';
      button.innerHTML = `<span class="unit-icon" style="${unitSpriteStyle(unit.id)}"></span><b>${unit.name}</b><small>${unit.points} PTS · ${unit.role}</small>`;
      button.onclick = () => { this.run.unlockedUnits.push(unit.id); this.save(); $('#event-dialog').close(); this.finishPostWarEvent(); }; list.append(button);
    });
    $('#event-continue-button').hidden = true; $('#event-dialog').showModal();
  }

  openStoreEvent() {
    $('#event-kicker').textContent = '// POST-WAR · FIELD STORE'; $('#event-title').textContent = `REQUISITION ${this.run.currency}`;
    $('#event-copy').textContent = 'Choose one recovered relic, or conserve Requisition.';
    const list = $('#event-options'); list.innerHTML = '';
    shuffle(WARGEAR).slice(0,3).forEach((gear,index) => {
      const price = 20 + index * 10; const button = document.createElement('button'); button.className = 'event-card'; button.disabled = this.run.currency < price;
      button.innerHTML = `<span>⚙</span><b>${gear.name}</b><small>◆ ${price} · ${gear.desc}</small>`;
      button.onclick = () => { this.run.currency -= price; this.run.gear.push({gearId:gear.id,equippedTo:null,id:`${gear.id}-${Date.now()}`}); this.save(); $('#event-dialog').close(); this.finishPostWarEvent(); }; list.append(button);
    });
    $('#event-continue-button').hidden = false; $('#event-dialog').showModal();
  }

  finishPostWarEvent() {
    if ($('#event-dialog').open) $('#event-dialog').close();
    if (this.run?.rewardContext) return;
    const pending = this.run?.pendingPostWar; if (!pending) return;
    this.run.pendingPostWar = null; this.advanceRoute(pending.wasBoss, pending.node);
  }

  advanceRoute(wasBoss, node = null) {
    this.run.offers = null;
    if (wasBoss) {
      const sector = this.run.sectors[this.run.region];
      sector.status = 'complete'; sector.stars = this.run.sectorStars;
      this.run.story ||= {briefed:[],completed:[],pendingBriefing:null};
      if (!this.run.story.completed.includes(this.run.region)) this.run.story.completed.push(this.run.region);
      const tier = CAMPAIGN_TIERS[this.run.tierIndex];
      const permanent = tier.permanentReward * (node?.bossTier || 1);
      this.run.chests += permanent;
      const repair = this.stratagemEffects().bossRepair || 0;
      this.run.hull = Math.min(this.run.maxHull, this.run.hull + repair);
      const next = this.run.sectors[this.run.region + 1]; if (next) next.status = 'available';
      if (!next) return this.endRun(true);
      this.run.region = null; this.run.step = 0; this.run.sectorStars = 0;
      this.save(); this.renderHub(); this.show('hub'); return;
    } else this.run.step++;
    this.save();
    this.renderMap();
    this.show('map');
  }

  handleDefeat(node) {
    this.run.hull--;
    this.run.pendingNode = node;
    this.save();
    if (this.run.hull <= 0) return this.endRun(false);
    $('#run-end-kicker').textContent = '// BATTLE LOST';
    $('#run-end-title').textContent = 'REBUILD THE ARMY.';
    $('#run-end-copy').textContent = `${node.name} was lost. You have ${this.run.hull} campaign attempts remaining.`;
    $('#run-end-stats').innerHTML = `<span>ATTEMPTS LEFT<b>${this.run.hull}</b></span><span>POINTS LIMIT<b>${this.run.cap}</b></span>`;
    $('#run-end-button').textContent = 'EDIT ARMY';
    $('#run-end-button').dataset.action = 'retry';
    $('#run-end-dialog').showModal();
  }

  endRun(victory) {
    const earned = victory ? this.run.chests + Math.floor(this.run.currency * .25) : 0;
    this.meta.currency += earned;
    if (victory) this.meta.wins++;
    const snapshot = {battles:this.run.battles,bosses:this.run.bosses,data:this.run.data,stars:this.run.stars,chests:earned};
    this.run = null;
    this.save();
    $('#run-end-kicker').textContent = victory ? '// CAMPAIGN COMPLETE' : '// CAMPAIGN LOST';
    $('#run-end-title').textContent = victory ? 'VICTORY.' : 'THE OFFENSIVE ENDS.';
    $('#run-end-copy').textContent = victory ? 'Every required sector is secured. Banked campaign rewards are now permanent Requisition; run-only Enhancements, Stratagems and Wargear are cleared.' : 'The offensive ended before every required sector was secured. Banked campaign rewards were lost.';
    $('#run-end-stats').innerHTML = `<span>BATTLES WON<b>${snapshot.battles}</b></span><span>SECTORS CLEARED<b>${snapshot.bosses}</b></span><span>STARS<b>${snapshot.stars}</b></span><span>PERMANENT REQ<b>+${snapshot.chests}</b></span>`;
    $('#run-end-button').textContent = 'RETURN TO COMMAND';
    $('#run-end-button').dataset.action = 'home';
    $('#run-end-dialog').showModal();
  }

  handleEndButton() {
    const action = $('#run-end-button').dataset.action;
    $('#run-end-dialog').close();
    if (action === 'retry' && this.run) this.openLoadout();
    else { this.renderHome(); this.show('home'); }
  }

  renderResearch() {
    $('#research-currency').textContent = this.meta.currency;
    const grid = $('#research-grid'); grid.innerHTML = '';
    for (const research of RESEARCH) {
      const level = this.meta.research[research.id] || 0;
      const cost = research.costs[level];
      const card = document.createElement('article'); card.className = 'research-card';
      card.innerHTML = `<span class="research-icon">${research.icon}</span><div><h3>${research.name} <span class="research-level">LV ${level}/${research.max}</span></h3><p>${research.desc}</p></div>`;
      const button = document.createElement('button');
      button.textContent = level >= research.max ? 'MAX' : `${cost} BUY`;
      button.disabled = level >= research.max || this.meta.currency < cost;
      button.onclick = () => this.buyResearch(research.id);
      card.append(button); grid.append(card);
    }
  }

  buyResearch(id) {
    const research = RESEARCH.find(item => item.id === id);
    const level = this.meta.research[id] || 0;
    const cost = research.costs[level];
    if (level >= research.max || this.meta.currency < cost) return;
    this.meta.currency -= cost;
    this.meta.research[id] = level + 1;
    this.save(); this.renderResearch();
  }
}
