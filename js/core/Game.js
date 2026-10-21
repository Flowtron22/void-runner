import { BATTLE_HONOURS, WARGEAR, REGIONS, RESEARCH } from '../data/units.js';

const SAVE_KEY = 'void-runner-40k-campaign-v2';
const RUN_KEY = 'void-runner-40k-active-v2';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const pick = list => list[Math.floor(Math.random() * list.length)];
const shuffle = list => [...list].sort(() => Math.random() - .5);
const d6 = () => 1 + Math.floor(Math.random() * 6);

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

  renderHeader() {
    $('#meta-currency').textContent = this.meta.currency;
    $('#location-label').textContent = this.run ? `${this.faction(this.run.faction).name.toUpperCase()} // ${this.run.cap} PTS` : '40K CAMPAIGN';
  }

  show(name) {
    for (const screen of $$('.screen')) screen.classList.toggle('active', screen.id === `${name}-screen`);
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
      button.innerHTML = `<b>${faction.name}</b><small>${faction.units.length} UNIT PROFILES</small>`;
      button.disabled = Boolean(this.run);
      button.onclick = () => { this.selectedFaction = faction.id; this.renderHome(); };
      options.append(button);
    }
    $('#resume-button').hidden = !this.run;
    $('#new-run-button').textContent = this.run ? 'ABANDON & BEGIN NEW CAMPAIGN' : 'BEGIN 500 PT CAMPAIGN';
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
    $('#deploy-button').textContent = this.run.pendingNode ? 'START AUTO-BATTLE' : 'RETURN TO MAP';
    const chosen = this.unit(this.selectedBlueprint);
    $('#prep-status').textContent = legal ? `${this.run.deployed.length} UNITS · ${this.run.cap - used} PTS FREE` : chosen ? `${chosen.name.toUpperCase()} SELECTED` : 'SELECT A UNIT';
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
      el.className = `grid-unit ${this.selectedPlaced === placed.id ? 'selected' : ''}`;
      el.style.setProperty('--unit-color', unit.color);
      el.style.left = `calc(${placed.x} * ((100% - 10px) / 6 + 2px))`;
      el.style.top = `calc(${placed.y} * (var(--cell) + 2px))`;
      el.style.width = `calc(${w} * ((100% - 10px) / 6) + ${(w - 1) * 2}px)`;
      el.style.height = `calc(${h} * var(--cell) + ${(h - 1) * 2}px)`;
      el.innerHTML = `${unit.mark}<small>${unit.points}</small>`;
      el.title = `${unit.name} · ${unit.role} · ${unit.points} points`;
      el.onclick = event => { event.stopPropagation(); this.selectedPlaced = placed.id; this.selectedBlueprint = null; this.renderLoadout(); };
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
      const status = tooLarge ? `NEEDS ${unit.points} PT LIMIT` : `${unit.size[0]}×${unit.size[1]} · ${unit.models} MODEL${unit.models > 1 ? 'S' : ''} · ${unit.stock - deployedCount} LEFT`;
      button.innerHTML = `<span class="unit-icon">${unit.mark}</span><span class="unit-copy"><b>${unit.name}</b><small>${status}<br>T${unit.defense.toughness} · SV${unit.defense.save}+ · W${unit.defense.wounds} · ${weapon.name}: ${weapon.attacks}A ${weapon.hit}+ S${weapon.strength} AP${weapon.ap} D${weapon.damage}</small></span><span class="unit-cost">${unit.points}</span>`;
      button.onclick = () => { this.selectedBlueprint = unit.id; this.selectedPlaced = null; this.renderLoadout(); };
      roster.append(button);
    }
  }

  renderGear() {
    const list = $('#gear-inventory');
    list.innerHTML = '';
    if (!this.run.gear.length) {
      list.innerHTML = '<div class="protocol-card"><span>—</span><div><b>NO WARGEAR</b><small>Elite missions and bosses are more likely to award Wargear.</small></div></div>';
      return;
    }
    this.run.gear.forEach((item, index) => {
      const gear = WARGEAR.find(entry => entry.id === item.gearId);
      const owner = this.run.deployed.find(unit => unit.id === item.equippedTo);
      const button = document.createElement('button');
      button.className = `gear-card ${owner ? 'equipped' : ''}`;
      button.innerHTML = `<span><b>${gear.name}</b><small>${gear.desc}</small></span><span>${owner ? this.unit(owner.unitId).name : 'UNEQUIPPED'}</span>`;
      button.onclick = () => this.equipGear(index);
      list.append(button);
    });
  }

  renderProtocols() {
    const list = $('#protocol-list');
    list.innerHTML = '';
    if (!this.run.protocols.length) {
      list.innerHTML = '<div class="protocol-card"><span>—</span><div><b>NO BATTLE HONOURS</b><small>Win a battle to choose a temporary campaign bonus.</small></div></div>';
      return;
    }
    for (const id of this.run.protocols) {
      const honour = BATTLE_HONOURS.find(item => item.id === id);
      const el = document.createElement('div');
      el.className = 'protocol-card';
      el.innerHTML = `<span>◆</span><div><b>${honour.name}</b><small>${honour.desc}</small></div>`;
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

  removeSelected() {
    if (!this.selectedPlaced) return;
    this.run.deployed = this.run.deployed.filter(unit => unit.id !== this.selectedPlaced);
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
    button.innerHTML = `<b>${node.name}</b><small>${faction}</small><span>${node.reward || ''}</span>`;
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
      ...unit, instanceId:placed.id, side, x:placed.x ?? 0, y:placed.y ?? 0,
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
    return fighter;
  }

  makeEnemyForce(node) {
    const pool = this.units.filter(unit => unit.faction === node.enemyFaction && unit.points <= this.run.cap);
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
    const enemies = this.makeEnemyForce(node);
    this.battle = {
      node, players, enemies, round:0,
      log:[`Mission started against <b>${this.faction(node.enemyFaction).name}</b>.`],
      resolving:false, lastRoll:null, visibleStage:-1, actors:[], actorIndex:0, currentPlan:null
    };
    this.battleSpeed = 1;
    $('#speed-button').textContent = 'SPEED ×1';
    $('#battle-title').textContent = node.name;
    $('#battle-kicker').textContent = node.type === 'boss' ? '// BOSS BATTLE · D6 AUTO-ROLL' : '// D6 AUTOMATIC BATTLE';
    $('#player-power').textContent = `${this.usedPoints()} PTS`;
    $('#enemy-power').textContent = `${this.faction(node.enemyFaction).name.toUpperCase()} · THREAT ${Math.round(node.difficulty*100)}`;
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
    if (side === 'enemy') return [...foes].sort((a,b) => a.x - b.x || a.currentHp - b.currentHp)[0];
    return [...foes].sort((a,b) => a.currentHp - b.currentHp)[0];
  }

  prepareDiceAttack(actor, target) {
    const models = actor.hp.length;
    const attackDice = [];
    let attacks = 0;
    for (let model = 0; model < models; model++) {
      const roll = rollExpression(actor.weapon.attacks);
      attackDice.push(...roll.rolls);
      attacks += roll.total + actor.attacksBonus;
    }
    const effects = actor.side === 'player' ? this.protocolEffects() : {};
    const hitTarget = clamp(actor.weapon.hit - actor.hitBonus, 2, 6);
    const hitRolls = Array.from({length:attacks}, () => d6());
    let hits = hitRolls.filter(roll => roll !== 1 && roll >= hitTarget).length;
    const criticalHits = hitRolls.filter(roll => roll === 6).length;
    const autoWounds = effects.lethalHits ? criticalHits : 0;
    if (effects.sustainedHits) hits += criticalHits * effects.sustainedHits;
    const woundNeeded = clamp(woundTarget(actor.weapon.strength, target.toughness) - actor.woundBonus, 2, 6);
    const woundRolls = Array.from({length:Math.max(0,hits-autoWounds)}, () => d6());
    const rolledWounds = woundRolls.filter(roll => roll !== 1 && roll >= woundNeeded).length;
    const wounds = rolledWounds + autoWounds;
    const armourTarget = clamp(target.save - actor.weapon.ap - target.saveBonus, 2, 7);
    const saveTarget = Math.min(armourTarget, target.invuln || 7);
    const saveRolls = Array.from({length:wounds}, () => d6());
    const saves = saveRolls.filter(roll => saveTarget <= 6 && roll >= saveTarget).length;
    const unsaved = wounds - saves;
    const damageRolls = [];
    let damageLost = 0;
    const remainingHp = [...target.hp];
    for (let i = 0; i < unsaved && remainingHp.length; i++) {
      const result = rollExpression(actor.weapon.damage);
      damageRolls.push(...(result.rolls.length ? result.rolls : [result.total]));
      let damage = result.total;
      if (target.fnp <= 6) {
        const ignored = Array.from({length:damage}, () => d6()).filter(roll => roll >= target.fnp).length;
        damage -= ignored;
      }
      const lost = Math.min(remainingHp[0], damage);
      remainingHp[0] -= lost;
      damageLost += lost;
      if (remainingHp[0] <= 0) remainingHp.shift();
    }
    return {actor:actor.name,target:target.name,actorRef:actor,targetRef:target,attacks,attackDice,hitRolls,hitTarget,hits,woundRolls,woundNeeded,wounds,saveRolls,saveTarget,saves,damageRolls,damageLost,remainingHp,applied:false};
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
    this.addLog(`${plan.actor}: ${plan.attacks} attacks → ${plan.hits} hits → ${plan.wounds} wounds → ${plan.damageLost} damage${target.dead ? ' · DESTROYED' : ''}.`);
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
    this.battle.log = this.battle.log.slice(0, 4);
  }

  renderBattle() {
    $('#round-value').textContent = this.battle.round;
    this.renderForce($('#enemy-field'), this.battle.enemies);
    this.renderForce($('#player-field'), this.battle.players);
    $('#battle-log').innerHTML = this.battle.log.map(line => `<div>› ${line}</div>`).join('');
    this.renderDice();
  }

  renderForce(container, force) {
    container.innerHTML = '';
    for (const fighter of force) {
      const el = document.createElement('div');
      el.className = `fighter ${fighter.dead ? 'dead' : ''} ${fighter.flash || ''}`;
      el.style.setProperty('--fighter-color', fighter.side === 'enemy' ? '#ff496c' : fighter.color);
      el.innerHTML = `<b>${fighter.name}</b><small>${fighter.hp.length}/${fighter.models} models · T${fighter.toughness} · SV${fighter.save}+</small><div class="hp"><i style="width:${clamp(fighter.currentHp/fighter.maxHp*100,0,100)}%"></i></div>`;
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
    </div><div class="dice-outcome ${visible === 4 ? 'revealed' : ''}">${visible === 4 ? `${roll.damageLost} WOUNDS INFLICTED${roll.remainingHp.length ? '' : ' · UNIT DESTROYED'}` : 'RESOLUTION IN PROGRESS'}</div>`;
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
    this.renderBattle();
    setTimeout(() => {
      if (victory) this.openRewards(node);
      else this.handleDefeat(node);
      this.battle = null;
    }, 500);
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
      button.innerHTML = `<b>${honour.name}</b><small>${honour.desc}</small><span>${honour.tag} · THIS CAMPAIGN</span>`;
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
