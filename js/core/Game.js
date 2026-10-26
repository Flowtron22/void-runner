import { BATTLE_HONOURS, WARGEAR, RESEARCH, CAMPAIGN_TIERS, SECTOR_NAMES, STRATAGEMS } from '../data/units.js';
import { buildSectorChart, chartState } from './CampaignChart.js';
import { ensureConstellationPositions } from '../render/ChartLayout.js';
import { placementIssue, rankPlacementIssue } from './DraftPlacement.js';
import { bindDraftDrag } from '../ui/DraftDrag.js';
import { portraitMarkup } from '../data/portraits.js';
import { summarizeBattle, battleReportRows, addCombatTotals } from './BattleReport.js';
import {CHAPTER_UPGRADES,chapterProfile,migrateProgression,formationRows,migrateFormation,secureSector} from './Progression.js';
import {TACTICS,rollTacticOffer,rollStoreOffers} from './RunRewards.js';
import {BALANCE_VERSION,balanced,encounterDifficulty,threatCapacity,bossReward,earlyRecovery,pacedClaims,fortificationBonus,prepareTraining} from './Balance.js';

const DEBRIEF_ART = {
  victory:new URL('../../assets/directive-victory.webp',import.meta.url).href,
  failure:new URL('../../assets/directive-failure.webp',import.meta.url).href,
  recovery:new URL('../../assets/recovery-apothecary.webp',import.meta.url).href,
  requisition:new URL('../../assets/rogue-trader.jpg',import.meta.url).href
};

const SAVE_KEY = 'void-runner-40k-campaign-v2';
const RUN_KEY = 'combat-patrol-active-v3';

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
const EPIC_HERO_IDS = ['imperial-fists-darnath-lysander', 'space-wolves-bjorn-the-fell-handed', 'space-wolves-ragnar-blackmane', 'grey-knight-castellan-crowe', 'grey-knight-voldus', 'grey-knight-kaldor-draigo'];
const GREY_KNIGHT_UNIT_ART = {
  'grey-knight-venerable-dreadnought':[
    new URL('../../assets/units/grey-knights/dreadnought.png',import.meta.url).href
  ],
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
  id = id.split('--rescued-')[0];
  const aliases = {'grey-knight-kaldor-draigo':'grey-knight-terminators','grey-knight-interceptors':'grey-knight-strike-squad','grey-knight-purgation':'grey-knight-strike-squad','grey-knight-purifiers':'grey-knight-strike-squad','grey-knight-paladins':'grey-knight-terminators','grey-knight-champion':'grey-knight-strike-squad','grey-knight-chaplain':'brotherhood-librarian','grey-knight-techmarine':'grey-knight-strike-squad','grey-knight-brother-captain':'grey-knight-terminators','grey-knight-castellan-crowe':'grey-knight-strike-squad','grey-knight-voldus':'grey-knight-terminators'};
  id = aliases[id] || id;
  const unitArt = GREY_KNIGHT_UNIT_ART[id];
  if (unitArt) {
    const src = unitArt[variant % unitArt.length];
    return `--unit-art:url(${src});--unit-art-size:contain;--unit-art-position:center`;
  }
  const hash = [...id].reduce((sum, character) => sum + character.charCodeAt(0), 0);
  const [column, row] = UNIT_SPRITES[id] || [hash % 4, Math.floor(hash / 4) % 4];
  return `--icon-x:${column * 100 / 3}%;--icon-y:${row * 100 / 3}%`;
};

const escapeHTML = value => String(value ?? '').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

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
    migrateProgression(this.meta,this.run,CAMPAIGN_TIERS[this.run?.tierIndex || 0].points);
    this.meta.settings ||= {};
    if (this.run) {
      this.run.story ||= {briefed:[],completed:[],pendingBriefing:null};
      this.run.story.briefed ||= [];
      this.run.story.completed ||= [];
      this.run.story.pendingBriefing ??= null;
    }
    this.selectedFaction = this.run?.faction || 'grey-knights';
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
    $('#store-continue-button').onclick = () => this.finishPostWarEvent();
    $('#close-help-button').onclick = () => $('#help-dialog').close();
    $('#remove-button').onclick = () => this.removeSelected();
    $('#system-back').onclick=()=>{this.previewNode=null;this.renderMap();this.show('map');};
    $('#system-start').onclick=()=>{if(!this.previewNode)return;this.run.pendingNode=this.previewNode;this.previewNode=null;this.save();this.openLoadout('map');};
    $('#abandon-run').onclick=()=>{if(this.run && !this.battle)this.endRun(false);};
    $('#datasheet-back').onclick = () => this.closeDatasheet();
    $('#datasheet-draft').onclick = () => { this.selectedBlueprint=this.datasheetUnitId; this.selectedPlaced=null; this.closeDatasheet(); const unit=this.unit(this.selectedBlueprint); $('#prep-status').textContent=`TAP A FREE SPACE · ${this.sizeFor(unit,this.rotated).join('×')}`; $('#formation-grid .grid-cell')?.focus({preventScroll:true}); };
    $('#clear-button').onclick = () => {
      if (!this.run) return;
      this.run.deployed = [];
      for (const gear of this.run.gear) gear.equippedTo = null;
      this.selectedPlaced = null;
      this.renderLoadout(); this.save();
    };
    $('#deploy-button').onclick = () => this.finishPrep();
    $('#cancel-encounter-button').onclick = () => this.cancelEncounter();
    $('#boss-choice-back').onclick = () => { this.renderMap(); this.show('map'); };
    $('#speed-button').onclick = () => this.toggleSpeed();
    $('#skip-button').onclick = () => this.resolveBattleNow();
    $('#run-end-button').onclick = () => this.handleEndButton();
    for (const button of $$('.command-return')) button.onclick = () => { this.save(); this.renderHub(); this.show('hub'); };
    for (const button of $$('[data-prep-tab]')) button.onclick = () => this.setPrepTab(button.dataset.prepTab);
  }

  faction(id) { return this.factions.find(faction => faction.id === id); }
  unit(id) {
    const unit=this.units.find(unit => unit.id === id) || this.run?.rescuedUnits?.find(unit => unit.id === id);
    if(unit && balanced(this.run) && unit.faction===this.run.faction && !unit.sourceUnitId && !unit.leader)
      return {...unit,stock:unit.stock+Math.floor(Math.max(0,(this.run.missionCap || 500)-500)/600)};
    return unit;
  }

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
    if (name !== 'sector') {
      $('#sector-screen').classList.remove('sector-entering');
      $('#sector-screen').removeAttribute('aria-busy');
      $('#sector-map').inert = false;
    }
    if (name !== 'sector' && name !== 'map') {
      this.galaxyMountId++;
      this.galaxyScene?.destroy();
      this.galaxyScene = null;
    }
    let activeScreen = null;
    for (const screen of $$('.screen')) {
      const active = screen.id === `${name}-screen`;
      screen.classList.toggle('active', active);
      if (active) activeScreen = screen;
    }
    document.body.classList.toggle('main-menu-open', name === 'home');
    document.body.classList.toggle('intro-open', name === 'intro');
    document.body.classList.toggle('hub-open', name === 'hub');
    document.body.classList.toggle('battle-active', name === 'battle');
    document.body.classList.toggle('star-chart-open', name === 'sector' || name === 'map');
    if (name !== 'battle') this.clearBattleStage();
    this.currentScreen = name;
    if (this.run && name !== 'battle') { this.run.lastScreen = name; this.save({silent:true}); }
    if (activeScreen) {
      activeScreen.scrollTop = 0;
      activeScreen.scrollLeft = 0;
      requestAnimationFrame(() => {
        activeScreen.scrollTop = 0;
        activeScreen.scrollLeft = 0;
      });
    }
    window.scrollTo(0, 0);
    this.renderHeader();
  }

  goBack() {
    if (this.battle) return;
    if (this.currentScreen === 'store') return this.finishPostWarEvent();
    if (this.currentScreen === 'system') {this.previewNode=null;this.renderMap();return this.show('map');}
    if (this.currentScreen === 'run-end') return this.handleEndButton();
    if (this.currentScreen === 'datasheet') return this.closeDatasheet();
    if (this.currentScreen === 'mission') {
      if ($('#mission-accept-button').dataset.review === 'true') { this.renderMap(); return this.show('map'); }
      return this.closeMissionBriefing();
    }
    if (this.currentScreen === 'intro') { this.stopIntro(); this.renderHome(); return this.show('home'); }
    if (this.currentScreen === 'hub') { this.renderHome(); return this.show('home'); }
    if (this.currentScreen === 'setup') {
      this.renderHome(); return this.show('home');
    }
    if (this.currentScreen === 'loadout') {
      if (this.run?.pendingNode) return this.cancelEncounter();
      if (this.run?.pendingNode || this.loadoutReturn === 'map') { this.renderMap(); return this.show('map'); }
      if (this.loadoutReturn === 'sector') { this.renderSectors(); return this.show('sector'); }
      this.renderHub(); return this.show('hub');
    }
    if (this.currentScreen === 'boss-choice') { this.renderMap(); return this.show('map'); }
    if (this.currentScreen === 'map' || this.currentScreen === 'sector' || this.currentScreen === 'research') { this.renderHub(); return this.show('hub'); }
    if (this.currentScreen === 'reward') return;
    this.renderHome(); this.show('home');
  }

  renderHome() {
    $('#resume-button').hidden = !this.run;
    $('#new-run-button').textContent = 'NEW GAME';
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
    this.renderSetup('faction');
    this.show('setup');
  }

  renderSetup(stage) {
    this.setupStage = stage;
    const list = $('#setup-options'); list.innerHTML = '';
    $('#setup-title').textContent = 'TAKE YOUR OATH';
    list.classList.toggle('chapter-grid',stage === 'faction');
    if (stage === 'faction') CHAPTERS.forEach(chapter => {
      const button = document.createElement('button'); button.className = `chapter-card ${chapter.locked ? 'locked' : ''}`;
      button.disabled = chapter.locked;
      button.innerHTML = `<img src="${chapter.art}" alt=""><b>${chapter.label}</b>`;
      button.onclick = () => { this.setupChoice.faction = chapter.id; this.beginIntro(); }; list.append(button);
    });
  }

  startRun() {
    // Starting a replacement mission retains already secured chapter rewards.
    if(this.run)this.chapter().currency+=(this.run.chests || 0)+(balanced(this.run)?earlyRecovery(this.run):0);
    this.run=null;
    const tier = CAMPAIGN_TIERS[0];
    this.selectedFaction = this.setupChoice.faction || 'grey-knights';
    prepareTraining(chapterProfile(this.meta,this.selectedFaction));
    const factionUnits = this.units.filter(unit => unit.faction === this.selectedFaction);
    this.run = {
      rulesVersion:2,balanceVersion:BALANCE_VERSION,balanceVictories:[],formationVersion:2,securedSectors:[],seed: Date.now(), faction: this.selectedFaction, tierIndex:0, region:null, step:0, cap:tier.points,
      hull: 3 + (this.chapter().research.insurance || 0), maxHull: 3 + (this.chapter().research.insurance || 0),
      data:0, stars:0, sectorStars:0, currency:0, chests:0, protocols:[], stratagems:[], gear:[], deployed:[], history:[], offers:null,
      sectors:Array.from({length:tier.sectors},(_,i)=>({id:i,name:SECTOR_NAMES[i],status:i===0?'available':'locked',stars:0})),
      unlockedUnits:factionUnits.filter((unit,index)=>index<2 || unit.startingAvailable).map(unit=>unit.id), battles:0, bosses:0, pendingNode:null, pendingPostWar:null,
      story:{briefed:[],completed:[],pendingBriefing:null}
    };
    this.run.cap = this.getBaseCap();
    this.run.missionCap=this.run.cap;
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
      if (event === 'distress') return this.openDistressEvent();
      if (event === 'recruit') return this.openRecruitEvent();
      if (event === 'store') return this.openStoreEvent();
      return this.finishPostWarEvent();
    }
    if (this.run.pendingDefeat && this.run.pendingNode) return this.renderDefeatReport(this.run.pendingNode);
    if (this.run.pendingNode) return this.openLoadout('map');
    this.renderHub(); this.show('hub');
  }

  renderHub() {
    if (!this.run) return;
    $('#hub-army-status').textContent = `${this.usedPoints()} / ${this.getBaseCap()} PTS`;
    $('#hub-req-status').textContent = `◆ ${this.chapter().currency} · CHAPTER`;
    $('#mission-progress').innerHTML=this.run.sectors.map((s,i)=>`<span class="${s.status}">${s.status==='complete'?'✓':i+1}<small>${s.status==='complete'?'SECURED':s.status==='available'?'CURRENT':'LOCKED'}</small></span>`).join('');
    $('#mission-secured').textContent=`${this.run.chests || 0} CHAPTER REQ SECURED · ${this.run.currency} MISSION REQ`;
    $('#hub-mission-label').textContent = 'OPERATION';
  }

  openStrategium() {
    if (!this.run) return;
    if (this.run.region !== null) { this.renderMap(); return this.show('map'); }
    this.renderSectors(); this.show('sector');
  }

  protocolEffects() {
    const effects = {};
    for (const id of [...this.run.protocols,...(this.run.stratagems || []).filter(id=>id.startsWith('relic-'))]) {
      const next = [...BATTLE_HONOURS,...TACTICS].find(item => item.id === id)?.effect || {};
      for (const [key, value] of Object.entries(next)) effects[key] = typeof value === 'number' ? (effects[key] || 0) + value : value;
    }
    return effects;
  }

  chapter() {return chapterProfile(this.meta,this.run?.faction || this.selectedFaction || 'grey-knights');}
  researchRanks() {return this.run?.rulesVersion===2?this.chapter().research:this.meta.research;}

  getBaseCap() {
    if(this.run.rulesVersion===2)return Math.max(this.run.capacityFloor || 500,500+(this.chapter().research.capacity || 0)*150)+(this.protocolEffects().pointBonus || 0);
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
    if(this.run.rulesVersion===2)migrateFormation(this.run,this.getBaseCap());
    // New core squad patterns are available in existing saves as well as new missions.
    for(const unit of this.units.filter(u=>u.faction===this.run.faction && u.startingAvailable)) {
      if(!this.run.unlockedUnits.includes(unit.id)) this.run.unlockedUnits.push(unit.id);
    }
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
    $('#cancel-encounter-button').hidden = !this.run.pendingNode;
    $('#cancel-encounter-button').parentElement.classList.toggle('encounter-actions',Boolean(this.run.pendingNode));
    $('#deploy-button').textContent = this.run.pendingNode ? '⚔ BATTLE' : this.loadoutReturn === 'map' ? 'SYSTEM CHART' : '← RETURN TO COMMAND DECK';
    const chosen = this.unit(this.selectedBlueprint);
    $('#prep-status').textContent = legal ? `▦ ${this.run.deployed.length} · ${this.run.cap - used} FREE` : chosen ? `▸ ${chosen.name.toUpperCase()}` : '▦ SELECT';
  }

  renderFormation() {
    const grid = $('#formation-grid');
    grid.innerHTML = '';
    const rows=this.formationRowCount();grid.style.setProperty('--formation-rows',rows);
    $('#formation-label').textContent=this.run.rulesVersion===2?`FRONT: ROWS 1–${rows/2} · REAR: ROWS ${rows/2+1}–${rows}`:'DEPLOYMENT';
    for (let y = 0; y < rows; y++) for (let x = 0; x < 6; x++) {
      const cell = document.createElement('button');
      cell.className = `grid-cell ${y<rows/2?'front-slot':'rear-slot'}`;
      cell.setAttribute('aria-label',`${this.run.rulesVersion===2?(y<rows/2?'Frontline':'Rear line'):'Grid'} column ${x+1}, row ${y+1}`);
      cell.onclick=()=>{if(this.run.rulesVersion===2 && this.selectedPlaced && !this.selectedBlueprint){const p=this.run.deployed.find(p=>p.id===this.selectedPlaced);if(!p || p.attachedTo)return;if(this.run.deployed.some(p=>!p.attachedTo && p.x===x && p.y===y))return;Object.assign(p,{x,y,rank:y<rows/2?'front':'rear'});this.run.deployed.filter(i=>i.attachedTo===p.id).forEach(i=>Object.assign(i,{x,y,rank:p.rank}));this.save();this.renderLoadout();}else this.placeUnit(x,y);};
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
      el.innerHTML = `<span class="grid-token-art">${portraitMarkup(unit.id) || `<span class="grid-unit-icon" style="${unitSpriteStyle(unit.id,artVariant)}"></span>`}</span><small>${unit.points}</small><em>${placed.y<rows/2?'F':'R'} · ${unit.models}</em>`;
      el.title = `${unit.name} · ${unit.role} · ${unit.points} points`;
      el.setAttribute('aria-label',`${unit.name}, ${unit.points} points, column ${placed.x+1}, row ${placed.y+1}`);
      el.dataset.placedId=placed.id;
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
    const scrollTop=roster.scrollTop;
    roster.innerHTML = '';
    const candidates=[...this.units.filter(item => item.faction === this.run.faction), ...(this.run.rescuedUnits || [])];
    candidates.sort((a,b)=>Number(Boolean(!a.rescueKind && !this.run.unlockedUnits.includes(a.id)))-Number(Boolean(!b.rescueKind && !this.run.unlockedUnits.includes(b.id))));
    for (const unit of candidates) {
      const deployedCount = this.run.deployed.filter(item => item.unitId === unit.id).length;
      const out = deployedCount >= unit.stock;
      const tooLarge = unit.points > this.run.cap;
      const unrecovered = !unit.rescueKind && !this.run.unlockedUnits.includes(unit.id);
      const button = document.createElement('button');
      button.className = `unit-card portrait-card ${this.selectedBlueprint === unit.id ? 'selected' : ''} ${out || tooLarge || unrecovered ? 'unavailable' : ''}`;
      button.style.setProperty('--unit-color', unit.color);
      const status = unrecovered ? 'UNRECOVERED · FIND IN SECTOR' : tooLarge ? `LOCKED · ${unit.points} PTS` : unit.rescueKind ? `${unit.rescueKind} · ${this.faction(unit.faction).name} · MISSION ONLY · ×${unit.stock - deployedCount}` : unit.leader ? `${this.run.rulesVersion===2?'1 SLOT':unit.size.join('×')} · ♛ GRID OR BODYGUARD · ×${unit.stock - deployedCount}` : `${this.run.rulesVersion===2?'1 SLOT':unit.size.join('×')} · ◉${unit.models} · ×${unit.stock - deployedCount}`;
      button.setAttribute('aria-label', `${unit.name}, ${unit.points} points, ${status}`);
      const cardName=unit.name.replace(/^Brotherhood /,'');
      const badge=unrecovered?'SEALED':out?'DEPLOYED':tooLarge?'OVER CAP':`×${unit.stock-deployedCount}`;
      const portrait=portraitMarkup(unit.id);
      button.innerHTML = `<span class="portrait-art ${portrait?'illustrated':''}" style="${portrait?'':unitSpriteStyle(unit.id)}" aria-hidden="true">${portrait}</span><span class="portrait-stock">${badge}</span><span class="portrait-caption"><b>${escapeHTML(cardName)}</b><small>${unit.points} PTS <i>${this.run.rulesVersion===2?'1 SLOT':unit.size.join('×')}</i></small></span>${unit.rescueKind?'<span class="rescue-mark">MISSION</span>':''}`;
      button.onclick = () => this.openDatasheet(unit.id);
      if(!out && !tooLarge && !unrecovered) bindDraftDrag(button,unit,this);
      roster.append(button);
    }
    roster.scrollTop=scrollTop;
  }

  openDatasheet(id) {
    const unit=this.unit(id);
    if(!unit) return;
    this.rosterScroll=$('#unit-roster').scrollTop;
    this.datasheetUnitId=id;
    const ref=unit.datasheet;
    const profile=ref?.profile || {movement:null,...unit.defense,leadership:unit.leadership,oc:unit.oc};
    $('#datasheet-title').textContent=unit.name;
    const portrait=portraitMarkup(id,true);
    $('#datasheet-portrait').style.cssText=portrait?'':unitSpriteStyle(id);
    $('#datasheet-portrait').classList.toggle('illustrated',Boolean(portrait));
    $('#datasheet-portrait').innerHTML=portrait;
    $('#datasheet-portrait').setAttribute('aria-label',`${unit.name} portrait`);
    $('#datasheet-subtitle').textContent=`${this.faction(unit.faction).name} · ${unit.role}${ref?.classification?` · ${ref.classification}`:''}`;
    $('#datasheet-stats').innerHTML=[['M',profile.movement?`${profile.movement}″`:'—'],['T',profile.toughness],['SV',`${profile.save}+`],['W',profile.wounds],['LD',`${profile.leadership}+`],['OC',profile.oc]].map(([label,value])=>`<div><small>${label}</small><b>${value}</b></div>`).join('');
    $('#datasheet-invuln').textContent=profile.invuln<7?`INVULNERABLE SAVE · ${profile.invuln}+`:'NO INVULNERABLE SAVE';
    const weapons=ref?.weapons || [unit.weapon];
    const weaponSection=(name,list)=>`<details><summary>${name}</summary><div class="datasheet-weapons">${list.length?list.map(w=>`<article><b>${escapeHTML(w.name)}</b><div class="weapon-values">${[['R',w.range?`${w.range}″`:'Melee'],['A',w.attacks],['BS/WS',`${w.hit}+`],['S',w.strength],['AP',w.ap],['D',w.damage]].map(([k,v])=>`<span><small>${k}</small>${escapeHTML(v)}</span>`).join('')}</div><small>${escapeHTML(w.keywords.join(' · '))}</small></article>`).join(''):'<p>None listed.</p>'}</div></details>`;
    const issue=this.draftAvailability(unit);
    $('#datasheet-content').innerHTML=weaponSection('RANGED WEAPONS',weapons.filter(w=>w.range>0))+weaponSection('MELEE WEAPONS',weapons.filter(w=>w.range===0))+`<details><summary>ABILITIES</summary><p>${(ref?.abilities || unit.abilities).map(escapeHTML).join(' · ')}</p>${ref?.abilitySummary?`<p>${escapeHTML(ref.abilitySummary)}</p><p class="reference-note">REFERENCE ABILITIES</p>`:''}</details><details><summary>UNIT COMPOSITION</summary><p>${escapeHTML(ref?.composition || `${unit.models} model${unit.models===1?'':'s'}`)}</p>${unit.leader?`<p>LEADS: ${unit.leader.targets.map(id=>escapeHTML(this.unit(id)?.name || id)).join(' · ')}</p>`:''}</details><details open><summary>ORDEAL PROFILE</summary><p>${unit.points} PTS · ${unit.models} MODELS · ${this.run.rulesVersion===2?'1 FORMATION SLOT':unit.size.join('×')+' SPACE'} · STOCK ${unit.stock}</p><p>T${unit.defense.toughness} · SV${unit.defense.save}+ · W${unit.defense.wounds} · LD${unit.leadership}+ · OC${unit.oc}</p><p>COMBAT WEAPON: ${escapeHTML(unit.weapon.name)}</p>${ref?``:''}</details>`;
    $('#datasheet-draft').disabled=Boolean(issue);
    $('#datasheet-draft').textContent=issue || `DRAFT · ${unit.points} PTS`;
    this.show('datasheet');
    $('#datasheet-back').focus({preventScroll:true});
  }

  closeDatasheet() {
    const id=this.datasheetUnitId;
    this.openLoadout();
    $('#unit-roster').scrollTop=this.rosterScroll || 0;
    [...$('#unit-roster').children].find(card=>card.getAttribute('aria-label')?.startsWith(this.unit(id)?.name+','))?.focus({preventScroll:true});
  }

  draftAvailability(unit) {
    if(!unit || (!unit.rescueKind && !this.run.unlockedUnits.includes(unit.id))) return 'PATTERN UNRECOVERED · FIND IN SECTOR';
    if(this.run.deployed.filter(p=>p.unitId===unit.id).length>=unit.stock) return 'ALL COPIES DEPLOYED';
    if(this.usedPoints()+unit.points>this.run.cap) return 'NOT ENOUGH POINTS';
    return null;
  }

  draftIssue(unit,x,y) {
    if(this.run.rulesVersion===2)return rankPlacementIssue({unit,unlocked:Boolean(unit?.rescueKind || this.run.unlockedUnits.includes(unit?.id)),deployed:this.run.deployed,cap:this.run.cap,used:this.usedPoints(),x,y,rows:this.formationRowCount()});
    return placementIssue({unit,unlocked:Boolean(unit?.rescueKind || this.run.unlockedUnits.includes(unit?.id)),deployed:this.run.deployed,cap:this.run.cap,used:this.usedPoints(),x,y,rotated:this.rotated,unitFor:id=>this.unit(id)});
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

  effectDescription(item) {
    return balanced(this.run) && item.id==='relic-brotherhood'?'Infantry gain +1 attack per unit and +1 Toughness.':item.desc;
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
      const stratagem = TACTICS.find(item => item.id === id);
      const el = document.createElement('div'); el.className = 'protocol-card'; el.title = this.effectDescription(stratagem);
      el.innerHTML = `<span>⌖</span><div><b>${stratagem.name}</b><small>STRATAGEM · ${stratagem.tag}</small></div>`;
      list.append(el);
    }
  }

  setPrepTab(tab) {
    for (const button of $$('[data-prep-tab]')) button.classList.toggle('active', button.dataset.prepTab === tab);
    for (const list of $$('.prep-list')) list.classList.remove('active');
    $(`#${tab === 'units' ? 'unit-roster' : tab === 'gear' ? 'gear-inventory' : 'protocol-list'}`).classList.add('active');
  }

  formationRowCount() {return this.run?.rulesVersion===2?formationRows(this.run.cap):5;}
  sizeFor(unit, rotated) {if(this.run?.rulesVersion===2)return [1,1];return rotated ? [unit.size[1], unit.size[0]] : unit.size; }

  canPlace(x, y, w, h) {
    if (x < 0 || y < 0 || x + w > 6 || y + h > 5) return false;
    return !this.run.deployed.some(placed => {
      const [pw, ph] = this.sizeFor(this.unit(placed.unitId), placed.rotated);
      return x < placed.x + pw && x + w > placed.x && y < placed.y + ph && y + h > placed.y;
    });
  }

  placeUnit(x, y) {
    const unit = this.unit(this.selectedBlueprint);
    if (!unit) return;
    const issue=this.draftIssue(unit,x,y);
    if(issue) { $('#prep-status').textContent=issue; return; }
    this.run.deployed.push({ id: `${unit.id}-${Date.now()}-${Math.random()}`, unitId: unit.id, x, y, rank:y<this.formationRowCount()/2?'front':'rear', rotated:false });
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
    this.run.deployed.push({id:`${leader.id}-${Date.now()}`,unitId:leader.id,x:bodyguard.x,y:bodyguard.y,rank:bodyguard.rank,rotated:false,attachedTo:bodyguard.id});
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

  renderSectors({onSelect = id => this.enterSector(Number(id))} = {}) {
    this.galaxyScene?.destroy();
    this.galaxyScene = null;
    const map = $('#sector-map');
    $('#sector-title').textContent = 'MISSION';
    map.className = 'sector-map webgl-star-map';
    const activeIndex = Number.isInteger(this.run.region) ? this.run.region : null;
    if (activeIndex !== null && this.run.sectors[activeIndex]) this.run.sectors[activeIndex].status = 'available';
    if (!this.run.sectors.some(sector => sector.status === 'available')) {
      const nextSector = this.run.sectors.find(sector => sector.status !== 'complete');
      if (nextSector) nextSector.status = 'available';
    }
    map.innerHTML = `<canvas class="galaxy-webgl" aria-hidden="true"></canvas><div class="webgl-map-labels"></div><div class="webgl-map-vignette" aria-hidden="true"></div><div class="webgl-map-readout" aria-hidden="true"><span>ASTRONOMICAN LINK</span><b>SEGMENTUM CHART</b></div>`;
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
    const mounted = this.mountGalaxyScene({
        viewport:map,canvas:map.querySelector('.galaxy-webgl'),labelLayer,mode:'galaxy',systems,
        reducedMotion:Boolean(this.meta.settings?.reducedMotion),
        onSelect
      },map);
    this.save();
    return mounted;
  }

  async mountGalaxyScene(options,map) {
    const mountId=++this.galaxyMountId;
    try {
      const { GalaxyMap3D }=await this.galaxyModulePromise;
      if (mountId!==this.galaxyMountId || !map.isConnected) return;
      this.galaxyScene?.destroy();
      this.galaxyScene=new GalaxyMap3D(options);
      return this.galaxyScene;
    } catch (error) {
      if (mountId!==this.galaxyMountId) return;
      console.error('Unable to initialize the stellar chart',error);
      map.classList.add('webgl-fallback');
      const positions = options.systems.map(system => system.position);
      const minX = Math.min(...positions.map(p => p[0])) - 2;
      const maxX = Math.max(...positions.map(p => p[0])) + 2;
      const minY = Math.min(...positions.map(p => p[1])) - 2;
      const maxY = Math.max(...positions.map(p => p[1])) + 2;
      const anchors = new Map();
      for (const system of options.systems) {
        const point = [(system.position[0]-minX)/(maxX-minX)*100, (maxY-system.position[1])/(maxY-minY)*100];
        anchors.set(system.id, point);
        if (!system.button) continue;
        system.button.hidden = false;
        system.button.style.setProperty('--fallback-x', `${point[0]}%`);
        system.button.style.setProperty('--fallback-y', `${point[1]}%`);
        system.button.onclick = system.locked ? null : () => options.onSelect(system.id);
      }
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.classList.add('webgl-route-fallback'); svg.setAttribute('viewBox', '0 0 100 100');
      svg.setAttribute('preserveAspectRatio', 'none'); svg.setAttribute('aria-hidden', 'true');
      for (const route of options.routes || []) {
        const from = anchors.get(route.from), to = anchors.get(route.to);
        if (!from || !to) continue;
        const line = document.createElementNS(svg.namespaceURI, 'line');
        for (const [key,value] of Object.entries({x1:from[0],y1:from[1],x2:to[0],y2:to[1],stroke:route.available?'#95bb8d':'#67726c','stroke-width':.2,'stroke-dasharray':'.7 .6'})) line.setAttribute(key,value);
        svg.append(line);
      }
      map.prepend(svg);
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
    $('#mission-accept-button').textContent = review ? 'SYSTEM CHART' : 'ACCEPT DIRECTIVE';
    $('#mission-accept-button').dataset.review = review ? 'true' : 'false';
    $('#mission-belay-button').hidden = review;
    this.missionReturnScreen = review ? 'map' : 'sector';
    this.show('mission');
  }

  closeMissionBriefing() {
    if (this.run?.story) this.run.story.pendingBriefing = null;
    this.save();
    this.renderSectors();
    this.show('sector');
  }

  async acceptMission() {
    if ($('#mission-accept-button').dataset.review === 'true') {
      this.renderMap();
      return this.show(this.missionReturnScreen || 'map');
    }
    const index = this.run?.story?.pendingBriefing;
    if (index === null || index === undefined) return;
    this.run.story.pendingBriefing = null;
    if (!this.run.story.briefed.includes(index)) this.run.story.briefed.push(index);
    this.run.region = index; this.run.step = 0; this.run.sectorStars = 0; this.run.offers = null;
    this.run.history = this.run.history.filter(node => node.region !== index);
    this.save();
    const reducedMotion = this.meta.settings?.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (reducedMotion) { this.renderMap(); return this.show('map'); }

    const enteringRun = this.run;
    const finishEntry = () => {
      if (this.run !== enteringRun || this.currentScreen !== 'sector') return;
      this.renderMap();
      this.show('map');
    };
    const mounted = this.renderSectors({onSelect: finishEntry});
    this.show('sector');
    $('#sector-title').textContent = `ENTERING ${this.run.sectors[index].name}`;
    $('#sector-screen').classList.add('sector-entering');
    $('#sector-screen').setAttribute('aria-busy', 'true');
    $('#sector-map').inert = true;
    const scene = await mounted;
    if (this.run !== enteringRun || this.currentScreen !== 'sector') return;
    if (!scene) return finishEntry();
    scene.flyTo(String(index), {duration: 1100, arrivalDistance: 2.8});
  }

  sectorDepth() {
    const chart = this.run.sectors?.[this.run.region]?.chart;
    return chart?.version === 2 ? chart.depth : CAMPAIGN_TIERS[this.run.tierIndex].depth;
  }

  ensureSectorChart() {
    const sector = this.run.sectors[this.run.region];
    if (sector.chart?.version === 2) return sector.chart;
    // Keep an already selected/visible legacy encounter; shorten only its unvisited tail.
    const pending = this.run.pendingNode || this.run.rewardContext?.node || this.run.pendingPostWar?.node;
    const hasRegular = pending ? pending.type !== 'boss' : this.run.offers?.some(node => node.type !== 'boss');
    const depth = Math.max(3, this.run.step + (hasRegular ? 1 : 0));
    sector.chart = buildSectorChart({region:this.run.region,depth,step:this.run.step,
      makeLayer:step => this.makeOffers(step,this.run.region,depth), offers:this.run.offers,
      history:this.run.history, previousLayers:sector.chart?.layers});
    return sector.chart;
  }

  makeOffers(s = this.run.step, r = this.run.region, depth = this.sectorDepth()) {
    const tier = CAMPAIGN_TIERS[this.run.tierIndex];
    if (s === depth) {
      const enemy = this.enemyFaction();
      const thresholds = [0,5,8];
      return [1,2,3].map((bossTier,lane) => ({
        id:`r${r}-boss-${bossTier}`,type:'boss',bossTier,
        name:(r===3 && this.run.rulesVersion===2?['FINAL WARLORD','FINAL CHAMPION','FINAL APEX COMMANDER']:['WARLORD','CHAMPION','APEX COMMANDER'])[bossTier-1],
        reward:this.run.rulesVersion===2?`${bossTier}★ · SECURE ${balanced(this.run)?bossReward(bossTier):30} CHAPTER REQ`:`${bossTier}★ · BANK ${tier.permanentReward * bossTier} REQ ON CAMPAIGN VICTORY`,
        difficulty:balanced(this.run)?encounterDifficulty({type:'boss',bossTier},r):(1 + bossTier * .22) * tier.enemyScale, enemyFaction:enemy.id,
        locked:this.run.sectorStars < thresholds[bossTier-1], threshold:thresholds[bossTier-1], stars:bossTier,lane
      }));
    }
    const names = ['PATROL CLASH','SUPPLY RAID','LINE ENGAGEMENT','ARMOURED COLUMN','BREAKTHROUGH','VOID AMBUSH','RELIC DEFENCE'];
    return [1,2,3].map((stars,index) => {
      const eventRoll = (r * 7 + s * 3 + index) % 7;
      const event = eventRoll === 2 ? 'distress' : eventRoll === 5 ? 'store' : null;
      const type = stars === 3 ? 'elite' : event === 'store' ? 'salvage' : 'skirmish';
      return {id:`r${r}s${s}n${index}`,type,name:names[(r+s+index)%names.length],stars,event,lane:index,
        reward:event === 'distress' ? 'DISTRESS' : event === 'store' ? 'FIELD STORE' : '',
        difficulty:balanced(this.run)?encounterDifficulty({stars,step:s},r):(.62 + stars * .14 + s * .035) * tier.enemyScale,enemyFaction:this.enemyFaction().id};
    });
  }

  renderMap() {
    this.galaxyScene?.destroy();
    this.galaxyScene = null;
    const tier = CAMPAIGN_TIERS[this.run.tierIndex];
    const sector = this.run.sectors[this.run.region];
    const chart = this.ensureSectorChart();
    const depth = chart.depth;
    const state = chartState(sector.chart, this.run.history, this.run.region, this.run.step, this.run.sectorStars);
    this.run.offers = state.nodes.filter(node => node.step === this.run.step);
    $('#region-kicker').textContent = `SECTOR ${this.run.region + 1} / ${this.run.sectors.length} · AREA ${Math.min(this.run.step + 1,depth + 1)} / ${depth + 1}`;
    $('#map-title').textContent = sector.name;
    $('#map-cap').textContent = this.run.cap;
    $('#run-hull').textContent = `${this.run.hull}/${this.run.maxHull}`;
    $('#run-data').textContent = this.run.sectorStars;
    $('#run-currency').textContent = this.run.currency;
    $('#run-protocol-count').textContent = this.run.protocols.length;
    const mission = this.missionFor(this.run.region);
    $('#mission-strip-title').textContent = mission.title;
    $('#mission-strip-progress').textContent = `${Math.min(this.run.step, depth)} / ${depth} TARGETS · ${this.run.sectorStars} ★`;
    const map = $('#route-map');
    map.className = 'route-map area-galaxy star-system-map webgl-star-map local-webgl-map sector-route-chart';
    map.innerHTML = `<canvas class="galaxy-webgl" aria-hidden="true"></canvas><div class="webgl-map-labels"></div><div class="webgl-map-vignette" aria-hidden="true"></div><div class="webgl-map-readout local" aria-hidden="true"><span>LOCAL CARTOGRAPHY</span><b>${sector.name}</b></div><div class="chart-view-controls" role="group" aria-label="Chart zoom"><button data-chart-zoom="in" aria-label="Zoom in">+</button><button data-chart-zoom="out" aria-label="Zoom out">−</button><button data-chart-zoom="all" aria-label="Show full system chart">ALL</button></div>`;
    const labelLayer = map.querySelector('.webgl-map-labels');
    ensureConstellationPositions(chart,this.run.seed + this.run.region * 9173);
    const start = document.createElement('button');
    start.className = 'webgl-map-label route-start'; start.disabled = true;
    start.innerHTML = '<b>START POINT</b><small>VIGILANT</small>';
    labelLayer.append(start);
    const systems = [{id:sector.chart.start, name:'START POINT', tone:'ice', size:.65,
      position:chart.positions[chart.start], locked:true, current:state.currentId === sector.chart.start, button:start}];
    state.nodes.forEach(node => {
      const choice = this.makeNodeButton(node,`webgl-map-label ${node.status} ${node.type}`,!node.locked,true);
      if (node.id === state.currentId) choice.classList.add('current-position');
      labelLayer.append(choice);
      systems.push({
        id:node.id,name:node.name,tone:node.type === 'boss-system' ? 'crimson' : node.event === 'distress' ? 'ice' : 'amber',size:node.type === 'boss-system' ? 1.1 : .85,
        position:chart.positions[node.id],
        locked:node.locked,available:!node.locked,complete:node.status === 'complete',current:node.id === state.currentId,button:choice
      });
    });
    const routes = sector.chart.links.map(link => ({...link,
      travelled:state.cleared.has(link.to) && (state.cleared.has(link.from) || link.from === sector.chart.start),
      available:link.from === state.currentId && state.nodes.some(node => node.id === link.to && !node.locked)}));
    this.mountGalaxyScene({
        viewport:map,canvas:map.querySelector('.galaxy-webgl'),labelLayer,mode:'local',systems,routes,
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
    const labels = {skirmish:'BATTLE',elite:'ELITE',salvage:'SUPPLY',repair:'RECOVERY',boss:'SECTOR BOSS','boss-system':'FINAL SYSTEM',closed:'UNKNOWN'};
    const faction = node.enemyFaction ? this.faction(node.enemyFaction).name : labels[node.type];
    const rewardIcon = node.type.startsWith('boss') ? '♜' : node.type === 'repair' ? '♥' : node.type === 'elite' ? '✦' : node.type === 'salvage' ? '⚙' : '◆';
    const signal = node.event === 'distress' ? 'DISTRESS' : node.event === 'recruit' ? 'REINFORCEMENTS' : node.event === 'store' ? 'FIELD STORE' : '';
    const status = node.status === 'complete' ? 'CLEARED' : node.status === 'bypassed' ? 'BYPASSED' : node.needsStars && node.step === this.run.step ? `NEEDS ${node.threshold} ★` : signal;
    button.innerHTML = `<b>${rewardIcon} ${node.name}</b><small>${faction}</small><span class="system-difficulty" aria-label="Difficulty ${node.stars || 1} of 3">${'★'.repeat(node.stars || 1)}</span>${status ? `<span class="system-signal ${node.event === 'distress' ? 'distress-signal' : ''}">${status}</span>` : ''}`;
    button.title = `${node.name} · Difficulty ${node.stars || 1}/3${node.locked ? ' · Not reachable yet' : ' · Reachable'}${signal ? ` · ${signal}` : ''}`;
    if (node.type === 'boss-system') {
      button.innerHTML = '<b>♜ SECTOR COMMAND</b><span class="system-signal">FINAL SYSTEM</span>';
      button.title = `Final system · Choose boss difficulty on arrival${node.locked ? ' · Not reachable yet' : ' · Reachable'}`;
    }
    button.setAttribute('aria-label', `${button.title} · ${faction}`);
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

  systemRewardPlan(node) {
    this.run.rewardPlans ||= {};
    if(!this.run.rewardPlans[node.id]) {
      const req=Math.round((18+(node.stars || 1)*8)*(1+(this.researchRanks().salvage || 0)*.15)*(1+(this.protocolEffects().requisitionBonus || 0)));
      this.run.rewardPlans[node.id]={req,stratagems:rollTacticOffer(this.run.stratagems || []),honours:shuffle(BATTLE_HONOURS.filter(h=>!this.run.protocols.includes(h.id))).map(h=>h.id).slice(0,3),wargear:shuffle(WARGEAR).map(g=>g.id).slice(0,3)};this.save();
    }
    return this.run.rewardPlans[node.id];
  }

  openSystemBriefing(node) {
    this.previewNode=structuredClone(node);
    const plan=this.systemRewardPlan(node),context=this.ensureRewardState({node,req:plan.req,...plan});
    $('#system-title').textContent=node.name;
    $('#system-enemy').textContent=this.faction(node.enemyFaction).name+' · '+'★'.repeat(node.stars || 1)+' · THREAT '+Math.round(node.difficulty*100);
    $('#system-art').innerHTML=portraitMarkup('grey-knight-strike-squad',true);
    $('#system-drops').innerHTML=this.rewardSegmentOptions(context).map(o=>'<article><b>'+escapeHTML(o.name)+'</b>'+(o.kind==='currency'?'<p>'+plan.req+' MISSION REQ</p>':'')+'</article>').join('')+(node.type==='boss'?'<article><b>SECTOR MILESTONE</b><p>'+(balanced(this.run)?bossReward(node.bossTier):30)+' CHAPTER REQ</p></article>':node.event==='store'?'<article><b>ROGUE TRADER</b></article>':node.event==='distress'?'<article><b>DISTRESS RESCUE</b></article>':'');
    this.show('system');
  }

  chooseNode(node) {
    if (!this.run || this.run.rewardContext || this.run.pendingPostWar || node.locked) return;
    if (!this.run.offers?.some(offer => offer.id === node.id && !offer.locked)) return;
    if (node.type === 'boss-system') return this.openBossChoices(node);
    if(this.run.rulesVersion===2)return this.openSystemBriefing(node);
    this.run.pendingNode = node;
    this.save();
    this.openLoadout('map');
  }

  cancelEncounter() {
    if (!this.run || this.battle || this.run.rewardContext || this.run.pendingPostWar) return;
    this.run.pendingNode = null;
    this.save(); this.renderMap(); this.show('map');
  }

  openBossChoices(node) {
    $('#boss-choice-title').textContent=this.run.region===3?'FINAL BOSS':'SECTOR COMMAND';
    $('#boss-choice-stars').textContent = `${this.run.sectorStars} ★ COLLECTED · CHOOSE YOUR ENGAGEMENT`;
    const list = $('#boss-tier-options'); list.innerHTML = '';
    for (const option of node.bossOptions) {
      const locked = this.run.sectorStars < option.threshold;
      const button = document.createElement('button'); button.className = 'boss-tier-option'; button.disabled = locked;
      button.innerHTML = `<span class="boss-tier-stars">${'★'.repeat(option.bossTier)}</span><b>${option.name}</b><small>${locked ? `REQUIRES ${option.threshold} COLLECTED STARS` : option.threshold ? `AVAILABLE · ${option.threshold} STARS REQUIRED` : 'ALWAYS AVAILABLE'}</small><span>${option.reward}</span>`;
      button.onclick = () => this.chooseBossTier(node.id,option.bossTier);
      list.append(button);
    }
    this.show('boss-choice');
  }

  chooseBossTier(systemId, bossTier) {
    const system = this.run?.offers?.find(node => node.id === systemId && node.type === 'boss-system' && !node.locked);
    const option = system?.bossOptions.find(boss => boss.bossTier === bossTier);
    if (!option || this.run.sectorStars < option.threshold || this.run.rewardContext || this.run.pendingPostWar) return;
    const chosen={...option,locked:false,step:this.run.step,region:this.run.region};
    if(this.run.rulesVersion===2)return this.openSystemBriefing(chosen);
    this.run.pendingNode=chosen;
    this.save(); this.openLoadout('map');
  }

  buildFighter(placed, side = 'player') {
    const unit = this.unit(placed.unitId);
    const fighter = {
      ...unit, instanceId:placed.id, side, x:placed.x ?? 0, y:placed.y ?? 0, attachedTo:placed.attachedTo || null,
      rank:placed.rank || (placed.x<3?'front':'rear'),
      toughness:unit.defense.toughness, save:unit.defense.save, invuln:unit.defense.invuln,
      hitBonus:0, woundBonus:0, saveBonus:0, attacksBonus:0, fnp:7,
      hp:Array(unit.models).fill(unit.defense.wounds), maxHp:unit.models * unit.defense.wounds,
      currentHp:unit.models * unit.defense.wounds, dead:false
    };
    if (side === 'player') {
      const gearItem = this.run.gear.find(item => item.equippedTo === placed.id);
      if (gearItem) {
        const gear = WARGEAR.find(item => item.id === gearItem.gearId);
        if(gear.stat==='weaponStrength')fighter.weapon={...fighter.weapon,strength:fighter.weapon.strength+gear.value};
        else if (gear.stat === 'toughness') fighter.toughness += gear.value;
        else if (gear.stat === 'invuln') fighter.invuln = Math.min(fighter.invuln, gear.value);
        else fighter[gear.stat] += gear.value;
      }
      const effects = this.protocolEffects();
      fighter.hitBonus += effects.hitBonus || 0;
      fighter.woundBonus += effects.woundBonus || 0;
      fighter.saveBonus += effects.saveBonus || 0;
      fighter.invuln = Math.min(fighter.invuln, effects.invuln || 7);
      fighter.fnp = effects.fnp || 7;
      const doctrine = balanced(this.run)?0:(this.researchRanks().doctrine || 0);
      if(this.run.rulesVersion===2) {
        const ranks=this.researchRanks(),type=unit.keywords.includes('Vehicle')?'vehicle':unit.keywords.includes('Infantry')?'infantry':null;
        if(type) {
          fighter.attacksBonus+=(balanced(this.run)?0:(ranks[type+'-attacks'] || 0))+(effects[type+'Attacks'] || 0);
          fighter.squadAttacks=balanced(this.run)?(ranks[type+'-attacks'] || 0)+(type==='infantry'?(effects.infantryAttacks || 0):0):0;
          if(balanced(this.run) && type==='infantry')fighter.attacksBonus-=effects.infantryAttacks || 0;
          fighter.toughness+=(balanced(this.run)?0:(ranks[type+'-toughness'] || 0))+(effects[type+'Toughness'] || 0);
          fighter.fortificationRank=balanced(this.run)?(ranks[type+'-toughness'] || 0):0;
          fighter.defense={...unit.defense,wounds:unit.defense.wounds+(balanced(this.run)?0:2*(ranks[type+'-wounds'] || 0))};
          fighter.squadWounds=balanced(this.run)?2*(ranks[type+'-wounds'] || 0):0;
          fighter.hp=Array(unit.models).fill(fighter.defense.wounds);
          fighter.hp[fighter.hp.length-1]+=fighter.squadWounds;
          fighter.maxHp=fighter.currentHp=fighter.hp.reduce((a,b)=>a+b,0);
          if(type==='infantry')fighter.invuln=Math.min(fighter.invuln,effects.infantryInvuln || 7);
        }
      }
      if (doctrine >= 1) fighter.hitBonus++;
      if (doctrine >= 2) fighter.woundBonus++;
      if (doctrine >= 3) fighter.fnp = Math.min(fighter.fnp, 6);
    }
    fighter.baseInvuln = fighter.invuln;
    return fighter;
  }

  makeEnemyForce(node) {
    const pool = this.units.filter(unit => unit.faction === node.enemyFaction && unit.points <= this.run.cap && !unit.leader);
    const target = Math.max(150, Math.round((this.run.rulesVersion===2?(balanced(this.run)?threatCapacity(this.run.missionCap || 500):(this.run.missionCap || 500)):this.usedPoints()) * node.difficulty));
    const force = [];
    let total = 0, safety = 0;
    while (total < target * .85 && safety++ < (balanced(this.run)?40:20)) {
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
    if(this.run.rulesVersion===2)force.forEach((unit,index)=>unit.rank=unit.weapon.range===0 || index<Math.ceil(force.length/2)?'front':'rear');
    if(balanced(this.run) && node.type==='boss' && this.run.region===3 && (node.bossTier || 1)>=2) {
      // The final elite force counters a developed run, not just with another HP sponge.
      for(const unit of force) {
        unit.hitBonus=1;
        if(node.bossTier===3) {
          unit.attacksBonus+=1;
          if(unit===force[0]){unit.woundBonus=1;unit.toughness+=1;}
        }
      }
    }
    return force;
  }

  startBattle(node) {
    const players = this.run.deployed.map(placed => this.buildFighter(placed));
    for (const leader of players.filter(unit => unit.attachedTo)) {
      const bodyguard = players.find(unit => unit.instanceId === leader.attachedTo);
      if (bodyguard) {
        leader.rank=bodyguard.rank;
        leader.protectedBy = bodyguard;
        bodyguard.leaderGrant = leader.leader?.grant || {};
      }
    }
    const enemies = this.makeEnemyForce(node);
    this.battle = {
      node, players, enemies, round:0,
      stats:{damageDealt:0,damageTaken:0},
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
      const effect = TACTICS.find(item => item.id === id)?.effect || {};
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
      if (!this.canAttack(actor)) continue;
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
    while (actor && !this.canAttack(actor)) actor = this.battle.actors[this.battle.actorIndex++];
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
    let pool = legal.length ? legal : foes;
    if(this.run.rulesVersion===2){const front=pool.filter(u=>u.rank==='front');if(front.length)pool=front;}
    if (side === 'enemy') return [...pool].sort((a,b) => a.x - b.x || a.currentHp - b.currentHp)[0];
    return [...pool].sort((a,b) => a.currentHp - b.currentHp)[0];
  }

  canAttack(actor) {
    if(actor.dead)return false;
    if(this.run.rulesVersion!==2)return true;
    const force=actor.side==='player'?this.battle.players:this.battle.enemies;
    const alive=force.filter(u=>!u.dead);
    if(!alive.some(u=>u.rank==='front')){alive.forEach(u=>u.rank='front');this.addLog((actor.side==='player'?'OUR':'ENEMY')+' REAR LINE ADVANCES');}
    return actor.weapon.range>0 || actor.rank==='front';
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
    attacks += (actor.squadAttacks || 0)+models * (tactics.openingAttacks || 0);
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
    const woundNeeded = clamp(woundTarget(actor.weapon.strength, target.toughness+fortificationBonus(target.fortificationRank || 0,target.currentHp/target.maxHp)) - actor.woundBonus - (tactics.openingWound || 0), 2, 6);
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
    this.battle.stats ||= {damageDealt:0,damageTaken:0};
    const damageKey=plan.actorRef.side === 'player' ? 'damageDealt' : 'damageTaken';
    this.battle.stats[damageKey]+=plan.damageLost;
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
    const max = unit.defense.wounds+(unit.hp.length===1?(unit.squadWounds || 0):0);
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
    const ordered=this.run.rulesVersion===2?[...force].sort((a,b)=>Number(a.rank==='rear')-Number(b.rank==='rear')):force;
    for (const fighter of ordered) {
      const el = document.createElement('div');
      const destroying = fighter.dead && performance.now() < (fighter.deathEffectUntil || 0);
      el.className = `fighter ${fighter.dead ? 'dead' : ''} ${destroying ? 'destroying' : ''} ${fighter.flash || ''}`;
      el.style.setProperty('--fighter-color', fighter.side === 'enemy' ? '#ff496c' : fighter.color);
      const states = [this.run.rulesVersion===2?(fighter.rank==='front'?'FRONTLINE':'REAR LINE'):'',fighter.battleShocked ? 'BATTLE-SHOCKED' : '', fighter.attachedTo ? 'LEADER' : '', fighter.protectedBy && !fighter.protectedBy.dead ? `ATTACHED TO ${fighter.protectedBy.name}` : ''].filter(Boolean).join(' · ');
      el.innerHTML = `<b>${fighter.name}</b><small>${fighter.hp.length}/${fighter.models} models · T${fighter.toughness+fortificationBonus(fighter.fortificationRank || 0,fighter.currentHp/fighter.maxHp)} · SV${fighter.save}+${states ? `<br>${states}` : ''}</small><div class="hp"><i style="width:${clamp(fighter.currentHp/fighter.maxHp*100,0,100)}%"></i></div>`;
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
      if (!this.canAttack(actor)) continue;
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
    this.run.lastBattleReport=summarizeBattle(this.battle,victory);
    this.run.combatTotals=addCombatTotals(this.run.combatTotals,this.run.lastBattleReport);
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
    if(balanced(this.run) && node.type!=='boss') {this.run.balanceVictories ||= [];if(!this.run.balanceVictories.includes(node.id))this.run.balanceVictories.push(node.id);}
    if (node.type === 'boss') this.run.bosses++;
    const plan=this.run.rulesVersion===2?this.systemRewardPlan(node):null;
    const req=plan?.req ?? Math.round((18+(node.stars || 1)*8)*(1+(this.researchRanks().salvage || 0)*.15));
    this.run.pendingDefeat=false;
    this.run.rewardContext = {node, req,...(plan || {}),report:this.run.lastBattleReport?.nodeId===node.id ? structuredClone(this.run.lastBattleReport) : null};
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
      context.claims = balanced(this.run)?pacedClaims({...node,region:node.region ?? this.run.region}):{currency:1, honour:1, stratagem:1, gear:total >= 4 ? 1 : 0, recovery:total >= 5 ? 1 : 0};
      context.claimed = {
        currency:Math.min(previous.currency || 0, 1), honour:Math.min(previous.honour || 0, 1),
        stratagem:Math.min(previous.stratagem || 0, 1), gear:0, recovery:0
      };
      context.rewardVersion = 2;
    }
    context.honours ||= shuffle(BATTLE_HONOURS.filter(item => !this.run.protocols.includes(item.id))).map(item => item.id);
    context.stratagems ||= rollTacticOffer(this.run.stratagems || []);
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
    $('#debrief-mission').textContent=`${context.node.name}${context.node.type==='boss'?` · WARLORD TIER ${context.node.bossTier || 1}`:''}`;
    this.renderReportStats('#debrief-stats',battleReportRows(context.report));
    $('#reward-data').textContent=`+${context.node.stars || 0} ★`;
    $('#reward-gear-line').textContent=`${context.node.type==='boss'?90*(context.node.bossTier || 1):20+context.node.stars*10} CAMPAIGN SCORE`;
    $('#reward-title').textContent = 'POST-WAR AFFAIRS';
    $('#reward-copy').textContent = remaining ? `${resolved} / ${context.totalClaims} AFFAIRS RESOLVED · CLEAR ALL LOOT TO CONTINUE` : 'ALL LOOT SECURED · THE ROUTE IS OPEN';
    const list = $('#reward-options'); list.innerHTML = '';
    for (const option of options) {
      const left = this.rewardRemaining(option.kind);
      if (!left) continue;
      const button = document.createElement('button');
      button.className = 'reward-option reward-branch pixel-panel';
      button.title = option.desc;
      button.setAttribute('aria-label', `${option.name}: ${option.desc}`);
      button.innerHTML = this.rewardBranchMarkup(option.kind,option.name,option.desc,option.tag);
      button.onclick = () => this.selectPostWarSegment(option.kind);
      list.append(button);
    }
    $('#reward-continue-button').hidden = remaining !== 0;
    $('#reward-continue-button').textContent=context.node.type==='boss'?'RETURN TO STRIKE CRUISER':'CONTINUE THE PATH →';
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
    const source = kind === 'honour' ? BATTLE_HONOURS : kind === 'stratagem' ? TACTICS : WARGEAR;
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
    const choiceName = kind === 'honour' ? 'ENHANCEMENT' : kind === 'stratagem' ? 'STRATAGEM / RELIC' : 'WARGEAR';
    $('#reward-title').textContent = `CHOOSE ${choiceName === 'ENHANCEMENT' ? 'AN' : 'A'} ${choiceName}`;
    $('#reward-copy').textContent = `ONE ${choiceName} MAY BE SECURED`;
    const list = $('#reward-options'); list.innerHTML = '';
    ids.forEach(id => {
      const item = source.find(entry => entry.id === id); const button = document.createElement('button');
      button.className = 'reward-option pixel-panel'; button.title = this.effectDescription(item);
      const symbol = kind === 'honour' ? ruleSymbol(`${item.name} ${item.tag}`) : kind === 'stratagem' ? '⌖' : '⚙';
      button.dataset.tier=item.tier || 'normal';
      button.innerHTML = this.rewardBranchMarkup(kind,`${symbol} ${item.name}`,this.effectDescription(item),kind === 'gear' ? 'RECOVERED WARGEAR' : `${(item.tier || 'normal').toUpperCase()} · ${item.tag}`);
      button.onclick = () => this.claimPostWarChoice(kind,id); list.append(button);
    });
    const back = document.createElement('button');
    back.className = 'reward-back'; back.textContent = '← POST-WAR AFFAIRS';
    back.onclick = () => this.renderRewardSegments(); list.append(back);
    $('#reward-continue-button').hidden = true;
  }

  claimPostWarChoice(kind,id) {
    if(!this.run?.rewardContext || !['honour','stratagem','gear'].includes(kind) || !this.rewardRemaining(kind)) return;
    const source=kind==='honour'?BATTLE_HONOURS:kind==='stratagem'?TACTICS:WARGEAR;
    if(!source.some(item=>item.id===id)) return;
    const offerKey={honour:'honours',stratagem:'stratagems',gear:'wargear'}[kind];
    if(!this.run.rewardContext[offerKey]?.slice(0,3).includes(id)) return;
    if (kind === 'honour' && !this.run.protocols.includes(id)) this.run.protocols.push(id);
    if (kind === 'stratagem' && !this.run.stratagems.includes(id)) {
      this.run.stratagems.push(id);
      this.run.currency += TACTICS.find(item => item.id === id)?.effect.currency || 0;
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
    if (node.event === 'distress') return this.openDistressEvent();
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

  distressOffer() {
    const pending = this.run.pendingPostWar;
    if (!pending || pending.node.event !== 'distress') return null;
    if (pending.rescueOffer !== undefined) return pending.rescueOffer;
    const recovered = new Set((this.run.rescuedUnits || []).map(unit => unit.sourceUnitId));
    const pool = this.units.filter(unit => unit.keywords?.includes('Imperium') &&
      unit.points <= this.getBaseCap() && !recovered.has(unit.id));
    const heroes = pool.filter(unit => EPIC_HERO_IDS.includes(unit.id));
    const unique = pool.filter(unit => !EPIC_HERO_IDS.includes(unit.id));
    const base = pick(heroes.length && (Math.random() < .35 || !unique.length) ? heroes : unique.length ? unique : pool);
    pending.rescueOffer = base ? {...structuredClone(base), id:`${base.id}--rescued-${pending.node.id}`,
      sourceUnitId:base.id, stock:1, rescueKind:EPIC_HERO_IDS.includes(base.id) ? 'EPIC HERO' : 'UNIQUE UNIT'} : null;
    this.save();
    return pending.rescueOffer;
  }

  claimDistressRescue() {
    const offer = this.distressOffer();
    if (!offer) return;
    this.run.rescuedUnits ||= [];
    if (!this.run.rescuedUnits.some(unit => unit.id === offer.id)) this.run.rescuedUnits.push(offer);
    this.save();
    this.finishPostWarEvent();
  }

  openDistressEvent() {
    const offer = this.distressOffer();
    $('#event-kicker').textContent = '// DISTRESS · SURVIVORS RECOVERED';
    $('#event-title').textContent = offer ? offer.rescueKind : 'SIGNAL RECOVERED';
    $('#event-copy').textContent = offer ? 'Joins your roster until this mission ends, across every remaining sector. Deploy through Ordeal using normal army points.' : 'No further eligible detachments remain. Recover 25 Requisition instead.';
    const list = $('#event-options'); list.innerHTML = '';
    const button = document.createElement('button'); button.className = 'event-card';
    if (offer) {
      button.innerHTML = `<span class="unit-icon" style="${unitSpriteStyle(offer.id)}"></span><b>${offer.name}</b><small>${this.faction(offer.faction).name} · ${offer.points} PTS · MISSION ONLY · RECRUIT</small>`;
      button.onclick = () => this.claimDistressRescue();
    } else {
      button.innerHTML = '<span>◆</span><b>RECOVER SUPPLIES</b><small>+25 MISSION REQUISITION</small>';
      button.onclick = () => { if (!this.run.pendingPostWar) return; this.run.currency += 25; this.finishPostWarEvent(); };
    }
    list.append(button);
    $('#event-continue-button').hidden = true;
    if (!$('#event-dialog').open) $('#event-dialog').showModal();
  }

  fieldStoreOffers() {
    const pending=this.run?.pendingPostWar;
    if(pending?.node.event!=='store')return [];
    if(!pending.storeOffers) {pending.storeOffers=rollStoreOffers(this.units.filter(u=>u.points<=this.getBaseCap()));this.save();}
    pending.storeOffers.forEach((o,i)=>{o.id ||= 'legacy-stock-'+i;o.kind ||= 'gear';o.sold ||= false;});
    return pending.storeOffers;
  }

  openStoreEvent() {
    if(this.run?.pendingPostWar?.node.event!=='store')return;
    if($('#event-dialog').open)$('#event-dialog').close();
    $('#store-currency').textContent=this.run.currency;
    const list=$('#store-options'),scroll=list.scrollTop;list.innerHTML='';
    for(const offer of this.fieldStoreOffers()) {
      const item=offer.kind==='unit'?this.unit(offer.unitId):WARGEAR.find(g=>g.id===offer.gearId);if(!item)continue;
      const description=offer.kind==='unit'?item.points+' ARMY PTS · '+item.models+' MODELS · MISSION-ONLY RECRUIT':item.desc;
      const button=document.createElement('button');button.className='store-item';button.disabled=offer.sold || this.run.currency<offer.price;
      button.setAttribute('aria-label',item.name+', '+offer.price+' Requisition. '+(offer.sold?'SOLD OUT':description));
      button.innerHTML='<span class="store-item-sigil">'+(offer.kind==='unit'?(portraitMarkup(item.id) || '♛'):'⚙')+'</span><span class="store-item-copy"><b>'+escapeHTML(item.name)+'</b><small>'+escapeHTML(description)+'</small></span><span class="store-item-price">'+(offer.sold?'SOLD OUT':'◆ '+offer.price)+'</span>';
      button.onclick=()=>this.purchaseStoreItem(offer.id);list.append(button);
    }
    list.scrollTop=scroll;this.show('store');
  }

  purchaseStoreItem(stockId) {
    const offer=this.fieldStoreOffers().find(o=>o.id===stockId || o.gearId===stockId);
    if(!offer || offer.sold || this.run.currency<offer.price)return;
    if(offer.kind==='unit') {
      const base=this.unit(offer.unitId);if(!base)return;
      this.run.rescuedUnits ||= [];
      this.run.rescuedUnits.push({...structuredClone(base),id:base.id+'--rescued-shop-'+this.run.pendingPostWar.node.id+'-'+offer.id,sourceUnitId:base.id,stock:1,rescueKind:EPIC_HERO_IDS.includes(base.id)?'EPIC HERO':'UNIQUE UNIT'});
    } else {
      if(!WARGEAR.some(g=>g.id===offer.gearId))return;
      this.run.gear.push({gearId:offer.gearId,equippedTo:null,id:offer.gearId+'-'+Date.now()});
    }
    this.run.currency-=offer.price;offer.sold=true;this.save();this.openStoreEvent();
  }

  finishPostWarEvent() {
    if ($('#event-dialog').open) $('#event-dialog').close();
    if (this.run?.rewardContext) return;
    const pending = this.run?.pendingPostWar; if (!pending) return;
    if (pending.node.event === 'distress' && pending.rescueOffer &&
      !this.run.rescuedUnits?.some(unit => unit.id === pending.rescueOffer.id)) return this.openDistressEvent();
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
      if(this.run.rulesVersion===2)secureSector(this.run,node);
      else this.run.chests+=tier.permanentReward*(node?.bossTier || 1);
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
    this.run.pendingDefeat=true;
    this.save();
    if (this.run.hull <= 0) return this.endRun(false);
    this.renderDefeatReport(node);
  }

  renderReportStats(selector,rows) {
    $(selector).innerHTML=rows.map(([name,value])=>`<span>${escapeHTML(name)}<b>${escapeHTML(value)}</b></span>`).join('');
  }

  rewardBranchMarkup(kind,name,desc,tag) {
    const illustration={honour:'grey-knight-champion',stratagem:'brotherhood-librarian',gear:'grey-knight-techmarine'}[kind];
    const picture=illustration?portraitMarkup(illustration):`<img src="${kind==='recovery'?DEBRIEF_ART.recovery:DEBRIEF_ART.requisition}" alt="" loading="lazy" />`;
    return `<span class="reward-picture" aria-hidden="true">${picture}</span><span class="reward-text"><b>${escapeHTML(name)}</b><small>${escapeHTML(desc)}</small><em>${escapeHTML(tag)}</em></span>`;
  }

  setEndArtwork(victory) {
    $('#run-end-screen').classList.toggle('failed',!victory);
    $('#run-end-art').src=victory?DEBRIEF_ART.victory:DEBRIEF_ART.failure;
    $('#run-end-art').alt=victory?'Grey Knight victorious over a vanquished daemon':'Grey Knights bearing their fallen brothers';
  }

  renderDefeatReport(node) {
    this.setEndArtwork(false);
    $('#run-end-kicker').textContent = '// BATTLE LOST';
    $('#run-end-title').textContent = 'DIRECTIVE FAILED';
    $('#run-end-copy').textContent = `${node.name}. The enemy remains. The sacrifice is recorded.`;
    this.renderReportStats('#run-end-stats',[...battleReportRows(this.run.lastBattleReport),['ATTEMPTS LEFT',`${this.run.hull} / ${this.run.maxHull}`],['POINTS LIMIT',this.run.cap]]);
    $('#run-end-button').textContent = 'REASSEMBLE STRIKE FORCE';
    $('#run-end-button').dataset.action = 'retry';
    this.show('run-end');
  }

  endRun(victory) {
    if(!this.run)return;
    const earned=this.run.rulesVersion===2?(this.run.chests || 0)+(balanced(this.run)?earlyRecovery(this.run):0):(victory?this.run.chests+Math.floor(this.run.currency*.25):0);
    if(this.run.rulesVersion===2) {this.chapter().currency+=earned;if(victory)this.chapter().wins++;}
    else this.meta.currency+=earned;
    if (victory) this.meta.wins++;
    const snapshot = {battles:this.run.battles,bosses:this.run.bosses,data:this.run.data,stars:this.run.stars,chests:earned,combat:this.run.combatTotals};
    this.run = null;
    this.save();
    this.setEndArtwork(victory);
    $('#run-end-kicker').textContent = victory ? '// CAMPAIGN COMPLETE' : '// CAMPAIGN LOST';
    $('#run-end-title').textContent = victory ? 'DIRECTIVE FULFILLED' : 'DIRECTIVE FAILED';
    $('#run-end-copy').textContent = victory ? 'The mission is secured. Sector rewards join this chapter’s permanent Requisition; temporary Requisition, recruits and equipment expire.' : 'The mission has ended. Secured sector rewards are retained by this chapter; temporary Requisition, recruits and equipment expire.';
    this.renderReportStats('#run-end-stats',[['BATTLES WON',snapshot.battles],['SECTORS CLEARED',snapshot.bosses],['STARS',snapshot.stars],['PERMANENT REQ',`+${snapshot.chests}`],['ENEMY LOSSES',snapshot.combat?.enemyModelsLost ?? '—'],['OUR LOSSES',snapshot.combat?.playerModelsLost ?? '—']]);
    $('#run-end-button').textContent = 'RETURN TO TITAN';
    $('#run-end-button').dataset.action = 'home';
    this.show('run-end');
  }

  handleEndButton() {
    const action = $('#run-end-button').dataset.action;
    if (action === 'retry' && this.run) { this.run.pendingDefeat=false; this.save(); this.openLoadout('map'); }
    else { this.renderHome(); this.show('home'); }
  }

  renderResearch() {
    const chapter=this.chapter();
    $('#research-title').textContent=this.faction(this.run?.faction || this.selectedFaction).name+' · CHAPTER ARMOURY';
    $('#research-currency').textContent=chapter.currency;
    const grid=$('#research-grid');grid.innerHTML='';
    for(const research of CHAPTER_UPGRADES) {
      const level=chapter.research[research.id] || 0,cost=research.cost(level);
      const card=document.createElement('article');card.className='research-card';
      card.innerHTML='<span class="research-icon">'+research.icon+'</span><div><h3>'+research.name+' <span class="research-level">'+level+'/'+research.max+'</span></h3><p>'+research.desc+'</p></div>';
      const button=document.createElement('button');button.textContent=level>=research.max?'MAX':cost+' BUY';button.disabled=level>=research.max || chapter.currency<cost;
      button.onclick=()=>this.buyResearch(research.id);card.append(button);grid.append(card);
    }
  }

  buyResearch(id) {
    const research=CHAPTER_UPGRADES.find(item=>item.id===id);if(!research)return;
    const chapter=this.chapter(),level=chapter.research[id] || 0,cost=research.cost(level);
    if(level>=research.max || chapter.currency<cost)return;
    chapter.currency-=cost;chapter.research[id]=level+1;
    this.save();this.renderResearch();
  }
}
