import { BATTLE_HONOURS, WARGEAR, REGIONS, RESEARCH } from '../data/units.js';

const SAVE_KEY = 'void-runner-40k-campaign-v2';
const RUN_KEY = 'void-runner-40k-active-v2';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const pick = list => list[Math.floor(Math.random() * list.length)];
const shuffle = list => [...list].sort(() => Math.random() - .5);
const d6 = () => 1 + Math.floor(Math.random() * 6);
const RULE_SYMBOLS = [
  [/Blast/i,'✹'], [/Rapid Fire/i,'»'], [/Melta/i,'◈'], [/Torrent/i,'≋'],
  [/Devastating/i,'☠'], [/Twin-?linked/i,'⟳'], [/Sustained/i,'✦'], [/Lethal/i,'†'],
  [/Anti-/i,'⌖'], [/Assault/i,'➜'], [/Heavy/i,'▰'], [/Oath/i,'◎'], [/Deep Strike/i,'⇣'],
  [/Synapse/i,'⌁'], [/Waaagh/i,'!'], [/Chivalric/i,'♜'], [/Leader|Rites|Alpha Warrior|Da Boss/i,'♛']
];
const ruleSymbol = rule => RULE_SYMBOLS.find(([pattern]) => pattern.test(rule))?.[1] || '◆';
const BATTLE_ART = {
  'space-marines': {src:new URL('../../gif/greyknight_A.gif', import.meta.url).href, facing:'right'},
  'orks': {src:new URL('../../gif/WAAAAAgon.gif', import.meta.url).href, facing:'left'},
  'tyranids': {src:new URL('../../gif/tyranids_A.gif', import.meta.url).href, facing:'right'},
  'imperial-knights': {src:new URL('../../gif/imperial_knight.gif', import.meta.url).href, facing:'left'}
};
const UNIT_SPRITES = {
  'intercessor-squad':[0,0], 'terminator-squad':[1,0], 'redemptor-dreadnought':[2,0], 'captain':[3,0],
  'boyz':[0,1], 'meganobz':[1,1], 'deff-dread':[2,1], 'warboss':[3,1],
  'termagants':[0,2], 'tyranid-warriors':[1,2], 'screamer-killer':[2,2], 'winged-tyranid-prime':[3,2],
  'armiger-helverin':[0,3], 'armiger-warglaive':[1,3], 'knight-paladin':[2,3], 'acastus-knight-asterius':[3,3]
};
const unitSpriteStyle = id => {
  const [column, row] = UNIT_SPRITES[id] || [0,0];
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

function rollExpression(value) {
  const text = String(value).replace(/\s/g, '').toUpperCase();
  if (/^\d+$/.test(text)) return { total: Number(text), rolls: [], flat: Number(text) };
  const match = text.match(/^(\d*)D(3|6)(?:\+(\d+))?$/);
  if (!match) return { total: 1, rolls: [], flat: 1 };
  const count = Number(match[1] || 1);
  const sides = Number(match[2]);
  const flat = Number(match[3] || 0);
  const rolls = Array.from({length:count}, () => 1 + Math.floor(Math.random() * sides));
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
    this.selectedFaction = this.run?.faction || this.factions[0].id;
    this.selectedBlueprint = null;
    this.selectedPlaced = null;
    this.rotated = false;
    this.battle = null;
    this.battleTimer = null;
    this.battleSpeed = 1;
    this.bindUI();
    this.renderHome();
    this.show('home');
  }

  load(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  }

  save() {
    localStorage.setItem(SAVE_KEY, JSON.stringify(this.meta));
    if (this.run) localStorage.setItem(RUN_KEY, JSON.stringify(this.run));
    else localStorage.removeItem(RUN_KEY);
    this.renderHeader();
  }

  bindUI() {
    $('#new-run-button').onclick = () => this.startRun();
    $('#resume-button').onclick = () => { this.renderMap(); this.show('map'); };
    $('#research-button').onclick = () => { this.renderResearch(); this.show('research'); };
    $('#research-back-button').onclick = () => this.show('home');
    $('#home-button').onclick = () => { if (!this.battle) { this.save(); this.renderHome(); this.show('home'); } };
    $('#help-button').onclick = () => $('#help-dialog').showModal();
    $('#close-help-button').onclick = () => $('#help-dialog').close();
    $('#open-loadout-button').onclick = () => this.openLoadout();
    $('#rotate-button').onclick = () => { this.rotated = !this.rotated; this.renderLoadout(); };
    $('#remove-button').onclick = () => this.removeSelected();
    $('#clear-button').onclick = () => { if (!this.run) return; this.run.deployed = []; this.selectedPlaced = null; this.renderLoadout(); this.save(); };
    $('#deploy-button').onclick = () => this.finishPrep();
    $('#speed-button').onclick = () => this.toggleSpeed();
    $('#skip-button').onclick = () => this.resolveBattleNow();
    $('#run-end-button').onclick = () => this.handleEndButton();
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
    $('#meta-currency').textContent = this.meta.currency;
    $('#location-label').textContent = this.run ? `${this.faction(this.run.faction).name.toUpperCase()} // ${this.run.cap} PTS` : '40K CAMPAIGN';
  }

  show(name) {
    for (const screen of $$('.screen')) screen.classList.toggle('active', screen.id === `${name}-screen`);
    document.body.classList.toggle('battle-active', name === 'battle');
    if (name !== 'battle') this.clearBattleStage();
    window.scrollTo(0, 0);
    this.renderHeader();
  }

  renderHome() {
    const options = $('#faction-options');
    options.innerHTML = '';
    for (const faction of this.factions) {
      const button = document.createElement('button');
      button.className = `faction-option ${this.selectedFaction === faction.id ? 'active' : ''}`;
      button.style.setProperty('--faction-color', faction.color);
      button.innerHTML = `<b>${faction.name}</b>`;
      button.disabled = Boolean(this.run);
      button.onclick = () => { this.selectedFaction = faction.id; this.renderHome(); };
      options.append(button);
    }
    $('#resume-button').hidden = !this.run;
    $('#new-run-button').textContent = this.run ? '↺ NEW CAMPAIGN' : '⚔ BEGIN · 500 PTS';
    this.renderHeader();
  }

  startRun() {
    const factionUnits = this.units.filter(unit => unit.faction === this.selectedFaction);
    this.run = {
      seed: Date.now(), faction: this.selectedFaction, region: 0, step: 0, cap: 500,
      hull: 3 + (this.meta.research.insurance || 0), maxHull: 3 + (this.meta.research.insurance || 0),
      data: 0, chests: 0, protocols: [], gear: [], deployed: [], history: [], offers: null,
      battles: 0, bosses: 0, pendingNode: null
    };
    this.run.cap = this.getBaseCap();
    this.meta.runs++;
    this.selectedBlueprint = factionUnits[0]?.id || null;
    this.selectedPlaced = null;
    this.save();
    this.openLoadout();
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
    return REGIONS[this.run.region].cap + (this.meta.research.logistics || 0) * 50 + (this.protocolEffects().pointBonus || 0);
  }

  usedPoints() {
    return this.run.deployed.reduce((sum, placed) => sum + this.unit(placed.unitId).points, 0);
  }

  openLoadout() {
    if (!this.run) return;
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
    $('#deploy-button').disabled = !legal;
    $('#deploy-button').textContent = this.run.pendingNode ? '⚔ BATTLE' : '⌖ MAP';
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
      const [w, h] = this.sizeFor(unit, placed.rotated);
      const el = document.createElement('button');
      el.className = `grid-unit ${this.selectedPlaced === placed.id ? 'selected' : ''} ${placed.attachedTo ? 'attached' : ''}`;
      el.style.setProperty('--unit-color', unit.color);
      el.style.left = `calc(${placed.x} * ((100% - 10px) / 6 + 2px))`;
      el.style.top = `calc(${placed.y} * (var(--cell) + 2px))`;
      el.style.width = `calc(${w} * ((100% - 10px) / 6) + ${(w - 1) * 2}px)`;
      el.style.height = `calc(${h} * var(--cell) + ${(h - 1) * 2}px)`;
      el.innerHTML = `<span class="grid-unit-icon" style="${unitSpriteStyle(unit.id)}" aria-hidden="true"></span><small>${unit.points}</small>`;
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
      const button = document.createElement('button');
      button.className = `unit-card ${this.selectedBlueprint === unit.id ? 'selected' : ''} ${out || tooLarge ? 'locked' : ''}`;
      button.style.setProperty('--unit-color', unit.color);
      button.disabled = out || tooLarge;
      const weapon = unit.weapon;
      const status = tooLarge ? `LOCKED · ${unit.points} PTS` : unit.leader ? `♛ → BODYGUARD · ×${unit.stock - deployedCount}` : `${unit.size[0]}×${unit.size[1]} · ◉${unit.models} · ×${unit.stock - deployedCount}`;
      const rules = [...(unit.weapon.keywords || []), ...(unit.abilities || [])].slice(0,5);
      const badges = rules.map(rule => `<span class="rule-badge" title="${rule}" aria-label="${rule}">${ruleSymbol(rule)}</span>`).join('');
      button.setAttribute('aria-label', `${unit.name}, ${unit.points} points, ${status}`);
      button.innerHTML = `<span class="unit-icon" style="${unitSpriteStyle(unit.id)}" aria-hidden="true"></span><span class="unit-copy"><b>${unit.name}</b><small class="unit-meta">${status}</small><span class="stat-chips"><i title="Toughness">T${unit.defense.toughness}</i><i title="Save">SV${unit.defense.save}+</i><i title="Wounds">W${unit.defense.wounds}</i><i title="Leadership">LD${unit.leadership}+</i><i title="Objective Control">OC${unit.oc}</i></span><span class="weapon-line-mini" title="${weapon.name}">⚔ ${weapon.attacks}A · ${weapon.hit}+ · S${weapon.strength} · AP${weapon.ap} · D${weapon.damage}</span><span class="rule-badges">${badges}</span></span><span class="unit-cost">${unit.points}<small>PTS</small></span>`;
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
    if (!this.run.protocols.length) {
      list.innerHTML = '<div class="protocol-card"><span>✦</span><div><b>EMPTY</b></div></div>';
      return;
    }
    for (const id of this.run.protocols) {
      const honour = BATTLE_HONOURS.find(item => item.id === id);
      const el = document.createElement('div');
      el.className = 'protocol-card';
      el.title = honour.desc;
      el.innerHTML = `<span>${ruleSymbol(`${honour.name} ${honour.tag}`)}</span><div><b>${honour.name}</b><small>${honour.tag}</small></div>`;
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
    if (unit.leader) { $('#prep-status').textContent = 'TAP AN ELIGIBLE DEPLOYED BODYGUARD UNIT'; return; }
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
    for (const gear of this.run.gear) if (gear.equippedTo === this.selectedPlaced) gear.equippedTo = null;
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
    if (!this.run || this.usedPoints() <= 0 || this.usedPoints() > this.run.cap) return;
    this.save();
    if (this.run.pendingNode) this.startBattle(this.run.pendingNode);
    else { this.renderMap(); this.show('map'); }
  }

  enemyFaction() {
    return pick(this.factions.filter(faction => faction.id !== this.run.faction));
  }

  makeOffers() {
    const r = this.run.region;
    const s = this.run.step;
    if (s === 3) {
      const enemy = this.enemyFaction();
      return [{ id:`r${r}-boss`, type:'boss', name:REGIONS[r].boss, reward:'BOSS REWARD', difficulty:1.08, enemyFaction:enemy.id }];
    }
    const pools = [
      [{type:'skirmish',name:'PATROL CLASH',reward:'+SCORE',difficulty:.65},{type:'salvage',name:'SUPPLY RAID',reward:'WARGEAR CHANCE',difficulty:.74}],
      [{type:'skirmish',name:'LINE ENGAGEMENT',reward:'+SCORE',difficulty:.72},{type:'elite',name:'ELITE DETACHMENT',reward:'GUARANTEED WARGEAR',difficulty:.92},{type:'repair',name:'FIELD HOSPITAL',reward:'+1 ATTEMPT',difficulty:0}],
      [{type:'elite',name:'ARMOURED COLUMN',reward:'RARE WARGEAR',difficulty:.98},{type:'skirmish',name:'BREAKTHROUGH',reward:'+SCORE',difficulty:.8}]
    ];
    return shuffle(pools[s]).slice(0, s === 1 ? 3 : 2).map((node, index) => ({...node,id:`r${r}s${s}n${index}`,enemyFaction:this.enemyFaction().id}));
  }

  renderMap() {
    if (!this.run.offers) this.run.offers = this.makeOffers();
    const region = REGIONS[this.run.region];
    $('#region-kicker').textContent = `WARZONE ${this.run.region + 1} / 4 · MISSION ${this.run.step + 1} / 4`;
    $('#map-title').textContent = region.name;
    $('#map-cap').textContent = this.run.cap;
    $('#run-hull').textContent = `${this.run.hull}/${this.run.maxHull}`;
    $('#run-data').textContent = this.run.data;
    $('#run-protocol-count').textContent = this.run.protocols.length;
    const map = $('#route-map');
    map.innerHTML = '';
    const history = this.run.history.filter(node => node.region === this.run.region);
    for (let step = 3; step >= 0; step--) {
      const row = document.createElement('div'); row.className = 'route-row';
      if (step < this.run.step) row.append(this.makeNodeButton(history.find(node => node.step === step) || {type:'closed',name:'COMPLETED',reward:''}, 'completed', false));
      else if (step === this.run.step) for (const node of this.run.offers) row.append(this.makeNodeButton(node, `available ${node.type}`, true));
      else row.append(this.makeNodeButton(step === 3 ? {type:'boss',name:region.boss,reward:'BOSS'} : {type:'closed',name:'UNKNOWN MISSION',reward:'LOCKED'}, `closed ${step === 3 ? 'boss' : 'closed'}`, false));
      map.append(row);
    }
    this.save();
  }

  makeNodeButton(node, classes, active) {
    const button = document.createElement('button');
    button.className = `route-node ${classes}`;
    const labels = {skirmish:'BATTLE',elite:'ELITE',salvage:'SUPPLY',repair:'RECOVERY',boss:'WARZONE BOSS',closed:'UNKNOWN'};
    const faction = node.enemyFaction ? this.faction(node.enemyFaction).name : labels[node.type];
    const rewardIcon = node.type === 'boss' ? '♜' : node.type === 'repair' ? '♥' : node.type === 'elite' ? '✦' : node.type === 'salvage' ? '⚙' : '◆';
    button.innerHTML = `<b>${rewardIcon} ${node.name}</b><small>${faction}</small><span>${node.reward || ''}</span>`;
    button.disabled = !active;
    if (active) button.onclick = () => this.chooseNode(node);
    return button;
  }

  chooseNode(node) {
    if (node.type === 'repair') {
      this.run.hull = Math.min(this.run.maxHull, this.run.hull + 1);
      this.run.data += 10;
      this.run.history.push({...node, region:this.run.region, step:this.run.step});
      this.advanceRoute(false);
      return;
    }
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
      force[0].name = REGIONS[this.run.region].boss;
      force[0].hp = force[0].hp.map(value => Math.ceil(value * 1.5));
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
      cp:{player:1,enemy:1}, insaneBravery:{player:false,enemy:false}, stratagemUsed:{player:false,enemy:false}, oathTarget:{player:null,enemy:null},
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
    const dice = Array.from({length:synapse ? 3 : 2}, d6);
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
      const roll = rollExpression(actor.weapon.attacks);
      attackDice.push(...roll.rolls);
      attacks += roll.total + actor.attacksBonus;
      if (rules.rapidFire) {
        const rapid = rollExpression(rules.rapidFire);
        attackDice.push(...rapid.rolls);
        attacks += rapid.total;
      }
      if (rules.blast) attacks += Math.floor(target.hp.length / 5) * rules.blast;
    }
    const effects = actor.side === 'player' ? this.protocolEffects() : {};
    const hitTarget = clamp(actor.weapon.hit - actor.hitBonus, 2, 6);
    let hitRolls = rules.torrent ? [] : Array.from({length:attacks}, () => d6());
    const oathReroll = target.instanceId === this.battle.oathTarget[actor.side];
    if (!rules.torrent && (oathReroll || leader.hitReroll === 'failed')) hitRolls = hitRolls.map(roll => roll !== 1 && roll >= hitTarget ? roll : d6());
    if (!rules.torrent && !oathReroll && leader.hitReroll !== 'failed') hitRolls = this.commandReroll(actor, hitRolls, hitTarget, 'Hit');
    let hits = rules.torrent ? attacks : hitRolls.filter(roll => roll !== 1 && roll >= hitTarget).length;
    const criticalHits = hitRolls.filter(roll => roll === 6).length;
    const autoWounds = effects.lethalHits || rules.lethalHits ? criticalHits : 0;
    const sustainedHits = Math.max(effects.sustainedHits || 0, rules.sustainedHits || 0, leader.sustainedHits || 0);
    if (sustainedHits) hits += criticalHits * sustainedHits;
    const woundNeeded = clamp(woundTarget(actor.weapon.strength, target.toughness) - actor.woundBonus, 2, 6);
    const antiNeeded = target.keywords?.includes('Infantry') ? rules.antiInfantry : target.keywords?.includes('Monster') ? rules.antiMonster : target.keywords?.includes('Vehicle') ? rules.antiVehicle : null;
    const effectiveWoundNeeded = Math.min(woundNeeded, antiNeeded || 7);
    let woundRolls = Array.from({length:Math.max(0,hits-autoWounds)}, () => d6());
    if (rules.woundReroll === 'failed') woundRolls = woundRolls.map(roll => roll !== 1 && roll >= effectiveWoundNeeded ? roll : d6());
    if (rules.woundReroll !== 'failed') woundRolls = this.commandReroll(actor, woundRolls, effectiveWoundNeeded, 'Wound');
    const rolledWounds = woundRolls.filter(roll => roll !== 1 && roll >= effectiveWoundNeeded).length;
    const wounds = rolledWounds + autoWounds;
    const criticalWoundNeeded = antiNeeded || 6;
    const devastating = rules.devastatingWounds ? woundRolls.filter(roll => roll !== 1 && roll >= criticalWoundNeeded).length : 0;
    const armourTarget = clamp(target.save - actor.weapon.ap - target.saveBonus, 2, 7);
    const saveTarget = Math.min(armourTarget, target.invuln || 7);
    let saveRolls = Array.from({length:Math.max(0,wounds-devastating)}, () => d6());
    saveRolls = this.commandReroll(target, saveRolls, saveTarget, 'Save');
    const saves = saveRolls.filter(roll => saveTarget <= 6 && roll >= saveTarget).length;
    const unsaved = wounds - saves;
    const damageRolls = [];
    let damageLost = 0;
    const remainingHp = [...target.hp];
    for (let i = 0; i < unsaved && remainingHp.length; i++) {
      const result = rollExpression(actor.weapon.damage);
      damageRolls.push(...(result.rolls.length ? result.rolls : [result.total]));
      let damage = result.total;
      if (rules.melta) damage += rules.melta;
      if (target.fnp <= 6) {
        const ignored = Array.from({length:damage}, () => d6()).filter(roll => roll >= target.fnp).length;
        damage -= ignored;
      }
      const lost = Math.min(remainingHp[0], damage);
      remainingHp[0] -= lost;
      damageLost += lost;
      if (remainingHp[0] <= 0) remainingHp.shift();
    }
    const ruleNotes = [halfRange && rules.rapidFire ? `Rapid Fire +${rules.rapidFire}` : '', rules.blast ? `Blast +${Math.floor(target.hp.length/5)*rules.blast}A/model` : '', rules.torrent ? 'Torrent: automatic hits' : '', rules.woundReroll ? 'Twin-linked wound re-rolls' : '', antiNeeded ? `Anti-${target.keywords.includes('Infantry') ? 'Infantry' : target.keywords.includes('Monster') ? 'Monster' : 'Vehicle'} ${antiNeeded}+` : '', devastating ? `${devastating} Devastating Wound${devastating === 1 ? '' : 's'}` : '', rules.melta ? `Melta +${rules.melta} damage` : '', sustainedHits ? `Sustained Hits ${sustainedHits}` : '', autoWounds ? `${autoWounds} Lethal Hit${autoWounds === 1 ? '' : 's'}` : ''].filter(Boolean);
    return {actor:actor.name,target:target.name,actorRef:actor,targetRef:target,attacks,attackDice,hitRolls,hitTarget,hits,woundRolls,woundNeeded:effectiveWoundNeeded,wounds,saveRolls,saveTarget,saves,damageRolls,damageLost,remainingHp,devastating,lethal:autoWounds,ruleNotes,applied:false};
  }

  commandReroll(unit, rolls, target, label) {
    if (!rolls.length || target > 6 || unit.battleShocked || this.battle.cp[unit.side] < 1 || this.battle.stratagemUsed[unit.side]) return rolls;
    const index = rolls.findIndex(roll => roll === 1 || roll < target);
    if (index < 0) return rolls;
    const next = [...rolls];
    next[index] = d6();
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
      el.className = `fighter ${fighter.dead ? 'dead' : ''} ${fighter.flash || ''}`;
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
    tray.innerHTML = `<div class="dice-caption"><span>${roll.actor}</span><i>ENGAGING</i><span>${roll.target}</span></div><div class="dice-sequence">
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
    const score = node.type === 'boss' ? 90 : node.type === 'elite' ? 45 : 28;
    const requisition = Math.round((node.type === 'boss' ? 45 : node.type === 'elite' ? 18 : 9) * (1 + (this.meta.research.salvage || 0) * .15));
    this.run.data += score;
    this.run.chests += requisition;
    this.run.battles++;
    if (node.type === 'boss') this.run.bosses++;
    let gear = null;
    if (node.type === 'boss' || node.type === 'elite' || node.type === 'salvage' || Math.random() < .3) {
      gear = pick(WARGEAR);
      this.run.gear.push({gearId:gear.id,equippedTo:null,id:`${gear.id}-${Date.now()}`});
    }
    const owned = new Set(this.run.protocols);
    const options = shuffle(BATTLE_HONOURS.filter(honour => !owned.has(honour.id))).slice(0,3);
    const list = $('#reward-options'); list.innerHTML = '';
    for (const honour of options) {
      const button = document.createElement('button');
      button.className = 'reward-option pixel-panel';
      button.title = honour.desc;
      button.setAttribute('aria-label', `${honour.name}: ${honour.desc}`);
      button.innerHTML = `<b>${ruleSymbol(`${honour.name} ${honour.tag}`)} ${honour.name}</b><span>${honour.tag}</span>`;
      button.onclick = () => this.chooseReward(honour.id, node);
      list.append(button);
    }
    $('#reward-data').textContent = `+${score}`;
    $('#reward-gear-line').textContent = gear ? `WARGEAR: ${gear.name.toUpperCase()}` : 'NO WARGEAR FOUND';
    this.save();
    this.show('reward');
  }

  chooseReward(honourId, node) {
    this.run.protocols.push(honourId);
    this.run.history.push({...node,region:this.run.region,step:this.run.step});
    this.run.pendingNode = null;
    this.advanceRoute(node.type === 'boss');
  }

  advanceRoute(wasBoss) {
    this.run.offers = null;
    if (wasBoss) {
      if (this.run.region === REGIONS.length - 1) return this.endRun(true);
      this.run.region++;
      this.run.step = 0;
      this.run.cap = this.getBaseCap();
    } else this.run.step++;
    this.save();
    this.renderMap();
    this.show('map');
  }

  handleDefeat(node) {
    this.run.hull--;
    this.run.pendingNode = null;
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
    const earned = this.run.chests;
    this.meta.currency += earned;
    if (victory) this.meta.wins++;
    const snapshot = {battles:this.run.battles,bosses:this.run.bosses,data:this.run.data,chests:earned};
    this.run = null;
    this.save();
    $('#run-end-kicker').textContent = victory ? '// CAMPAIGN COMPLETE' : '// CAMPAIGN LOST';
    $('#run-end-title').textContent = victory ? 'VICTORY.' : 'THE OFFENSIVE ENDS.';
    $('#run-end-copy').textContent = victory ? 'The final warzone is secured. Battle Honours and Wargear are cleared; Requisition remains.' : 'The army is lost, but recovered Requisition has reached command.';
    $('#run-end-stats').innerHTML = `<span>BATTLES WON<b>${snapshot.battles}</b></span><span>BOSSES DEFEATED<b>${snapshot.bosses}</b></span><span>SCORE<b>${snapshot.data}</b></span><span>REQUISITION<b>+${snapshot.chests}</b></span>`;
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
