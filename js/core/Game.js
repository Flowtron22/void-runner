import { UNITS, PROTOCOLS, GEAR, REGIONS, RESEARCH } from '../data/units.js';

const SAVE_KEY = 'void-runner-protocol-front-v1';
const RUN_KEY = 'void-runner-active-expedition-v1';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
const pick = list => list[Math.floor(Math.random() * list.length)];
const shuffle = list => [...list].sort(() => Math.random() - .5);

export class Game {
  constructor() {
    this.meta = this.load(SAVE_KEY, { currency: 0, research: { logistics: 0, doctrine: 0, salvage: 0, insurance: 0 }, runs: 0, wins: 0 });
    this.run = this.load(RUN_KEY, null);
    this.screen = 'home';
    this.selectedBlueprint = null;
    this.selectedPlaced = null;
    this.rotated = false;
    this.prepReturn = 'map';
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
    $('#open-loadout-button').onclick = () => this.openLoadout('map');
    $('#rotate-button').onclick = () => { this.rotated = !this.rotated; this.renderLoadout(); };
    $('#remove-button').onclick = () => this.removeSelected();
    $('#clear-button').onclick = () => { if (!this.run) return; this.run.deployed = []; this.selectedPlaced = null; this.renderLoadout(); this.save(); };
    $('#deploy-button').onclick = () => this.finishPrep();
    $('#speed-button').onclick = () => this.toggleSpeed();
    $('#skip-button').onclick = () => this.resolveBattleNow();
    $('#run-end-button').onclick = () => this.handleEndButton();
    for (const button of $$('[data-prep-tab]')) button.onclick = () => this.setPrepTab(button.dataset.prepTab);
  }

  renderHeader() {
    $('#meta-currency').textContent = this.meta.currency;
    $('#location-label').textContent = this.run ? `${REGIONS[this.run.region].name} // ${this.run.cap} PTS` : 'PROTOCOL FRONT';
  }

  show(name) {
    this.screen = name;
    for (const screen of $$('.screen')) screen.classList.toggle('active', screen.id === `${name}-screen`);
    window.scrollTo(0, 0);
    this.renderHeader();
  }

  renderHome() {
    $('#resume-button').hidden = !this.run;
    $('#new-run-button').textContent = this.run ? 'ABANDON & BEGIN NEW RUN' : 'BEGIN 500 PT EXPEDITION';
    this.renderHeader();
  }

  startRun() {
    const bonus = (this.meta.research.logistics || 0) * 50;
    this.run = {
      seed: Date.now(), region: 0, step: 0, cap: 500 + bonus,
      hull: 3 + (this.meta.research.insurance || 0), maxHull: 3 + (this.meta.research.insurance || 0),
      data: 0, chests: 0, protocols: [], gear: [], deployed: [], history: [], offers: null,
      battles: 0, bosses: 0, pendingNode: null
    };
    this.meta.runs++;
    this.selectedBlueprint = 'needle';
    this.selectedPlaced = null;
    this.prepReturn = 'map';
    this.save();
    this.openLoadout('map');
  }

  getBaseCap() {
    return REGIONS[this.run.region].cap + (this.meta.research.logistics || 0) * 50;
  }

  usedPoints() {
    return this.run.deployed.reduce((sum, placed) => sum + UNITS.find(unit => unit.id === placed.unitId).cost, 0);
  }

  openLoadout(returnTo = 'map') {
    if (!this.run) return;
    this.prepReturn = returnTo;
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
    $('#deploy-button').textContent = this.run.pendingNode ? 'LAUNCH AUTO-BATTLE' : 'RETURN TO MAP';
    const chosen = UNITS.find(unit => unit.id === this.selectedBlueprint);
    $('#prep-status').textContent = legal ? `${this.run.deployed.length} UNITS · ${this.run.cap - used} PTS FREE` : chosen ? `${chosen.name.toUpperCase()} SELECTED` : 'SELECT A UNIT TO PACK';
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
      const unit = UNITS.find(item => item.id === placed.unitId);
      const [w, h] = this.sizeFor(unit, placed.rotated);
      const el = document.createElement('button');
      el.className = `grid-unit ${this.selectedPlaced === placed.id ? 'selected' : ''}`;
      el.style.setProperty('--unit-color', unit.color);
      el.style.left = `calc(${placed.x} * ((100% - 10px) / 6 + 2px))`;
      el.style.top = `calc(${placed.y} * (var(--cell) + 2px))`;
      el.style.width = `calc(${w} * ((100% - 10px) / 6) + ${(w - 1) * 2}px)`;
      el.style.height = `calc(${h} * var(--cell) + ${(h - 1) * 2}px)`;
      el.innerHTML = `${unit.mark}<small>${unit.cost}</small>`;
      el.title = `${unit.name} · ${unit.role} · ${unit.cost} points`;
      el.onclick = event => { event.stopPropagation(); this.selectedPlaced = placed.id; this.selectedBlueprint = null; this.renderLoadout(); };
      grid.append(el);
    }
  }

  renderRoster() {
    const roster = $('#unit-roster');
    roster.innerHTML = '';
    for (const unit of UNITS) {
      const deployedCount = this.run.deployed.filter(item => item.unitId === unit.id).length;
      const locked = this.run.region < unit.unlock;
      const out = deployedCount >= unit.stock;
      const button = document.createElement('button');
      button.className = `unit-card ${this.selectedBlueprint === unit.id ? 'selected' : ''} ${locked || out ? 'locked' : ''}`;
      button.style.setProperty('--unit-color', unit.color);
      button.disabled = locked || out;
      const lockText = locked ? `UNLOCKS REGION ${unit.unlock + 1}` : `${unit.size[0]}×${unit.size[1]} CASE · ${unit.role.toUpperCase()} · ${unit.stock - deployedCount} LEFT`;
      button.innerHTML = `<span class="unit-icon">${unit.mark}</span><span class="unit-copy"><b>${unit.name}</b><small>${lockText}<br>${unit.desc}</small></span><span class="unit-cost">${unit.cost}</span>`;
      button.onclick = () => { this.selectedBlueprint = unit.id; this.selectedPlaced = null; this.renderLoadout(); };
      roster.append(button);
    }
  }

  renderGear() {
    const list = $('#gear-inventory');
    list.innerHTML = '';
    if (!this.run.gear.length) {
      list.innerHTML = '<div class="protocol-card"><span>—</span><div><b>NO RECOVERED GEAR</b><small>Elite contacts and bosses are more likely to drop equipment.</small></div></div>';
      return;
    }
    this.run.gear.forEach((item, index) => {
      const gear = GEAR.find(entry => entry.id === item.gearId);
      const owner = this.run.deployed.find(unit => unit.id === item.equippedTo);
      const ownerData = owner && UNITS.find(unit => unit.id === owner.unitId);
      const button = document.createElement('button');
      button.className = `gear-card ${owner ? 'equipped' : ''}`;
      button.innerHTML = `<span><b>${gear.name}</b><small>${gear.desc}</small></span><span>${owner ? ownerData.name : 'UNEQUIPPED'}</span>`;
      button.onclick = () => this.equipGear(index);
      list.append(button);
    });
  }

  renderProtocols() {
    const list = $('#protocol-list');
    list.innerHTML = '';
    if (!this.run.protocols.length) {
      list.innerHTML = '<div class="protocol-card"><span>—</span><div><b>NO ACTIVE PROTOCOLS</b><small>Win a contact to choose a temporary expedition modifier.</small></div></div>';
      return;
    }
    for (const id of this.run.protocols) {
      const protocol = PROTOCOLS.find(item => item.id === id);
      const el = document.createElement('div');
      el.className = 'protocol-card';
      el.innerHTML = `<span>◆</span><div><b>${protocol.name}</b><small>${protocol.desc}</small></div>`;
      list.append(el);
    }
  }

  setPrepTab(tab) {
    for (const button of $$('[data-prep-tab]')) button.classList.toggle('active', button.dataset.prepTab === tab);
    for (const list of $$('.prep-list')) list.classList.remove('active');
    $(`#${tab === 'units' ? 'unit-roster' : tab === 'gear' ? 'gear-inventory' : 'protocol-list'}`).classList.add('active');
  }

  sizeFor(unit, rotated) {
    return rotated ? [unit.size[1], unit.size[0]] : unit.size;
  }

  canPlace(x, y, w, h) {
    if (x + w > 6 || y + h > 5) return false;
    return !this.run.deployed.some(placed => {
      const unit = UNITS.find(item => item.id === placed.unitId);
      const [pw, ph] = this.sizeFor(unit, placed.rotated);
      return x < placed.x + pw && x + w > placed.x && y < placed.y + ph && y + h > placed.y;
    });
  }

  placeUnit(x, y) {
    const unit = UNITS.find(item => item.id === this.selectedBlueprint);
    if (!unit) return;
    const [w, h] = this.sizeFor(unit, this.rotated);
    const deployedCount = this.run.deployed.filter(item => item.unitId === unit.id).length;
    if (this.run.region < unit.unlock || deployedCount >= unit.stock) return;
    if (this.usedPoints() + unit.cost > this.run.cap) { $('#prep-status').textContent = `NEED ${this.usedPoints() + unit.cost - this.run.cap} MORE POINTS`; return; }
    if (!this.canPlace(x, y, w, h)) { $('#prep-status').textContent = 'THAT SHAPE DOES NOT FIT HERE'; return; }
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
    if (!this.selectedPlaced) { $('#prep-status').textContent = 'SELECT A PACKED UNIT FIRST'; return; }
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

  makeOffers() {
    const r = this.run.region;
    const s = this.run.step;
    if (s === 3) return [{ id: `r${r}-boss`, type: 'boss', name: REGIONS[r].boss, reward: 'BOSS CACHE', difficulty: 1.08 }];
    const pools = [
      [{type:'skirmish',name:'BROKEN PATROL',reward:'+DATA',difficulty:.68},{type:'salvage',name:'WRECK FIELD',reward:'GEAR CHANCE',difficulty:.76}],
      [{type:'skirmish',name:'SIGNAL HUNTERS',reward:'+DATA',difficulty:.75},{type:'elite',name:'VETERAN CELL',reward:'GUARANTEED GEAR',difficulty:.94},{type:'repair',name:'SILENT DOCK',reward:'+1 HULL',difficulty:0}],
      [{type:'elite',name:'IRON CENSOR',reward:'RARE GEAR',difficulty:1},{type:'skirmish',name:'DUST COLUMN',reward:'+DATA',difficulty:.82}]
    ];
    return shuffle(pools[s]).slice(0, s === 1 ? 3 : 2).map((node, index) => ({ ...node, id: `r${r}s${s}n${index}` }));
  }

  renderMap() {
    if (!this.run.offers) this.run.offers = this.makeOffers();
    const region = REGIONS[this.run.region];
    $('#region-kicker').textContent = `REGION ${this.run.region + 1} / 4 · CONTACT ${this.run.step + 1} / 4`;
    $('#map-title').textContent = region.name;
    $('#map-cap').textContent = this.run.cap;
    $('#run-hull').textContent = `${this.run.hull}/${this.run.maxHull}`;
    $('#run-data').textContent = this.run.data;
    $('#run-protocol-count').textContent = this.run.protocols.length;
    const map = $('#route-map');
    map.innerHTML = '';
    const regionHistory = this.run.history.filter(node => node.region === this.run.region);
    for (let step = 3; step >= 0; step--) {
      const row = document.createElement('div');
      row.className = 'route-row';
      if (step < this.run.step) {
        const chosen = regionHistory.find(node => node.step === step);
        row.append(this.makeNodeButton(chosen || {type:'closed',name:'CLEARED',reward:''}, 'completed', false));
      } else if (step === this.run.step) {
        for (const node of this.run.offers) row.append(this.makeNodeButton(node, `available ${node.type}`, true));
      } else {
        const future = step === 3 ? {type:'boss',name:region.boss,reward:'BOSS'} : {type:'closed',name:'UNKNOWN CONTACT',reward:'LOCKED'};
        row.append(this.makeNodeButton(future, `closed ${future.type}`, false));
      }
      map.append(row);
    }
    this.save();
  }

  makeNodeButton(node, classes, active) {
    const button = document.createElement('button');
    button.className = `route-node ${classes}`;
    const labels = {skirmish:'SKIRMISH',elite:'ELITE',salvage:'SALVAGE',repair:'RECOVERY',boss:'REGION BOSS',closed:'UNKNOWN'};
    button.innerHTML = `<b>${node.name}</b><small>${labels[node.type] || node.type}</small><span>${node.reward || ''}</span>`;
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
      this.renderMap();
      return;
    }
    this.run.pendingNode = node;
    this.save();
    this.openLoadout('battle');
  }

  buildFighter(placed, side = 'player') {
    const unit = UNITS.find(item => item.id === placed.unitId);
    const fighter = { ...unit, instanceId: placed.id, side, x: placed.x ?? 0, y: placed.y ?? 0, maxHp: unit.hp, currentHp: unit.hp, dead: false, lastStandUsed: false };
    if (side === 'player') {
      fighter.damage *= 1 + (this.meta.research.doctrine || 0) * .05;
      const equipped = this.run.gear.find(item => item.equippedTo === placed.id);
      if (equipped) {
        const gear = GEAR.find(item => item.id === equipped.gearId);
        fighter[gear.stat] = (fighter[gear.stat] || 0) + gear.value;
      }
      const effects = this.protocolEffects();
      fighter.damage *= effects.damage || 1;
      fighter.maxHp *= effects.health || 1;
      if (unit.role === 'Guard') fighter.maxHp += effects.guardHp || 0;
      if (unit.role === 'Artillery') fighter.damage *= effects.artillery || 1;
      if (this.hasAdjacent(placed)) fighter.armor = (fighter.armor || 0) + (effects.adjacentArmor || 0);
      fighter.heal = (fighter.heal || 0) * (effects.healing || 1);
      fighter.currentHp = Math.round(fighter.maxHp);
    }
    return fighter;
  }

  protocolEffects() {
    return this.run.protocols.reduce((all, id) => Object.assign(all, PROTOCOLS.find(item => item.id === id)?.effect), {});
  }

  hasAdjacent(placed) {
    return this.run.deployed.some(other => other.id !== placed.id && Math.abs(other.x - placed.x) + Math.abs(other.y - placed.y) <= 2);
  }

  makeEnemyForce(node) {
    const target = Math.max(220, Math.round(this.usedPoints() * node.difficulty));
    const pool = UNITS.filter(unit => unit.unlock <= this.run.region && unit.id !== 'chirurgeon');
    const force = [];
    let total = 0;
    let safety = 0;
    while (total < target * .86 && safety++ < 20) {
      const choices = pool.filter(unit => unit.cost <= target - total + 100);
      const unit = pick(choices.length ? choices : pool.slice(0, 2));
      force.push(this.buildFighter({id:`hostile-${force.length}`,unitId:unit.id,x:force.length % 3,y:Math.floor(force.length / 3)}, 'enemy'));
      total += unit.cost;
    }
    if (node.type === 'boss') {
      const boss = force[0];
      boss.name = REGIONS[this.run.region].boss;
      boss.maxHp = Math.round(boss.maxHp * 1.7);
      boss.currentHp = boss.maxHp;
      boss.damage = Math.round(boss.damage * 1.35);
      boss.color = '#ff496c';
    }
    return force;
  }

  startBattle(node) {
    const players = this.run.deployed.map(placed => this.buildFighter(placed));
    const enemies = this.makeEnemyForce(node);
    this.battle = { node, players, enemies, round: 0, log: [`Contact locked: <b>${node.name}</b>.`], resolving: false, killchainTriggered: false, killchainRound: -1 };
    this.run.pendingNode = node;
    this.battleSpeed = 1;
    $('#speed-button').textContent = 'SPEED ×1';
    $('#battle-title').textContent = node.name;
    $('#battle-kicker').textContent = node.type === 'boss' ? '// BOSS SIGNAL · AUTOMATED' : '// AUTOMATED ENGAGEMENT';
    $('#player-power').textContent = `${this.usedPoints()} PTS`;
    $('#enemy-power').textContent = `THREAT ${Math.round(node.difficulty * 100)}`;
    this.show('battle');
    this.renderBattle();
    const effects = this.protocolEffects();
    if (effects.opening) {
      for (const unit of players.filter(item => item.role === 'Artillery')) this.attack(unit, pick(enemies.filter(enemy => !enemy.dead)), true);
    }
    this.scheduleRound();
  }

  scheduleRound() {
    clearTimeout(this.battleTimer);
    this.battleTimer = setTimeout(() => this.runRound(), this.battleSpeed === 1 ? 850 : 330);
  }

  runRound(render = true) {
    if (!this.battle || this.battle.resolving) return;
    this.battle.round++;
    const actors = shuffle([...this.alive(this.battle.players), ...this.alive(this.battle.enemies)]).sort((a,b) => b.speed - a.speed);
    for (const actor of actors) {
      if (actor.dead) continue;
      const allies = actor.side === 'player' ? this.battle.players : this.battle.enemies;
      const foes = actor.side === 'player' ? this.battle.enemies : this.battle.players;
      if (!this.alive(foes).length) break;
      if (actor.heal && this.alive(allies).some(ally => ally.currentHp < ally.maxHp * .82)) this.heal(actor, allies);
      else this.attack(actor, this.chooseTarget(this.alive(foes), actor.side));
    }
    const regen = this.protocolEffects().regen || 0;
    if (regen) for (const fighter of this.alive(this.battle.players)) fighter.currentHp = Math.min(fighter.maxHp, fighter.currentHp + regen);
    if (render) this.renderBattle();
    if (!this.alive(this.battle.enemies).length) return this.finishBattle(true);
    if (!this.alive(this.battle.players).length || this.battle.round >= 40) return this.finishBattle(false);
    if (render) this.scheduleRound();
  }

  alive(force) { return force.filter(unit => !unit.dead); }

  chooseTarget(foes, attackerSide) {
    const guards = foes.filter(unit => unit.role === 'Guard' || unit.role === 'Heavy');
    if (guards.length && Math.random() < .72) return pick(guards);
    if (attackerSide === 'enemy') return [...foes].sort((a,b) => a.x - b.x || a.currentHp - b.currentHp)[0];
    return [...foes].sort((a,b) => a.currentHp - b.currentHp)[0];
  }

  heal(actor, allies) {
    const target = [...this.alive(allies)].sort((a,b) => a.currentHp / a.maxHp - b.currentHp / b.maxHp)[0];
    const amount = Math.max(1, Math.round(actor.heal));
    target.currentHp = Math.min(target.maxHp, target.currentHp + amount);
    target.flash = 'heal';
    this.addLog(`${actor.name} repairs ${target.name} for ${amount}.`);
  }

  attack(actor, target, opening = false) {
    if (!target || target.dead) return;
    const armor = target.armor || 0;
    const chainBonus = actor.side === 'player' && this.battle.killchainRound === this.battle.round ? 1.35 : 1;
    let damage = Math.max(1, Math.round(actor.damage * chainBonus * (.86 + Math.random() * .28) - armor));
    if (actor.role === 'Striker' && actor.x <= 1) damage = Math.round(damage * 1.2);
    if (actor.role === 'Breaker' && armor >= 3) damage = Math.round(damage * 1.35);
    target.currentHp -= damage;
    target.flash = 'hit';
    if (target.currentHp <= 0) {
      const lastStand = target.side === 'player' && this.protocolEffects().lastStand && !target.lastStandUsed;
      if (lastStand) { target.currentHp = 1; target.lastStandUsed = true; this.addLog(`${target.name} survives by Last-Light.`); }
      else {
        target.currentHp = 0;
        target.dead = true;
        this.addLog(`${target.name} is destroyed.`);
        if (actor.side === 'player' && this.protocolEffects().killchain && !this.battle.killchainTriggered) {
          this.battle.killchainTriggered = true;
          this.battle.killchainRound = this.battle.round + 1;
          this.addLog('Kill-Chain armed: +35% damage next round.');
        }
      }
    } else this.addLog(`${actor.name}${opening ? ' opens on' : ' hits'} ${target.name} for ${damage}.`);
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
  }

  renderForce(container, force) {
    container.innerHTML = '';
    for (const fighter of force) {
      const el = document.createElement('div');
      el.className = `fighter ${fighter.dead ? 'dead' : ''} ${fighter.flash || ''}`;
      el.style.setProperty('--fighter-color', fighter.side === 'enemy' ? '#ff496c' : fighter.color);
      el.innerHTML = `<b>${fighter.name}</b><small>${fighter.role}</small><div class="hp"><i style="width:${clamp(fighter.currentHp / fighter.maxHp * 100,0,100)}%"></i></div>`;
      container.append(el);
      fighter.flash = '';
    }
  }

  toggleSpeed() {
    if (!this.battle) return;
    this.battleSpeed = this.battleSpeed === 1 ? 2 : 1;
    $('#speed-button').textContent = `SPEED ×${this.battleSpeed}`;
    this.scheduleRound();
  }

  resolveBattleNow() {
    if (!this.battle || this.battle.resolving) return;
    clearTimeout(this.battleTimer);
    let safety = 60;
    while (this.battle && this.alive(this.battle.players).length && this.alive(this.battle.enemies).length && safety-- > 0) this.runRound(false);
    if (this.battle) this.renderBattle();
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
    }, 450);
  }

  openRewards(node) {
    const baseData = node.type === 'boss' ? 90 : node.type === 'elite' ? 45 : 28;
    const chestGain = Math.round((node.type === 'boss' ? 45 : node.type === 'elite' ? 18 : 9) * (1 + (this.meta.research.salvage || 0) * .15));
    this.run.data += baseData;
    this.run.chests += chestGain;
    this.run.battles++;
    if (node.type === 'boss') this.run.bosses++;
    let gear = null;
    if (node.type === 'boss' || node.type === 'elite' || node.type === 'salvage' || Math.random() < .3) {
      gear = pick(GEAR);
      this.run.gear.push({ gearId: gear.id, equippedTo: null, id: `${gear.id}-${Date.now()}` });
    }
    const owned = new Set(this.run.protocols);
    const options = shuffle(PROTOCOLS.filter(protocol => !owned.has(protocol.id))).slice(0, 3);
    if (!options.length) options.push(...shuffle(PROTOCOLS).slice(0, 3));
    const list = $('#reward-options');
    list.innerHTML = '';
    for (const protocol of options) {
      const button = document.createElement('button');
      button.className = 'reward-option pixel-panel';
      button.innerHTML = `<b>${protocol.name}</b><small>${protocol.desc}</small><span>${protocol.tag} · RUN ONLY</span>`;
      button.onclick = () => this.chooseReward(protocol.id, node);
      list.append(button);
    }
    $('#reward-data').textContent = `+${baseData}`;
    $('#reward-gear-line').textContent = gear ? `GEAR: ${gear.name.toUpperCase()}` : 'NO GEAR CACHE';
    this.save();
    this.show('reward');
  }

  chooseReward(protocolId, node) {
    this.run.protocols.push(protocolId);
    this.run.history.push({...node, region:this.run.region, step:this.run.step});
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
    $('#run-end-kicker').textContent = '// FORCE SHATTERED';
    $('#run-end-title').textContent = 'REBUILD THE CASE.';
    $('#run-end-copy').textContent = `${node.name} held the line. You have ${this.run.hull} campaign hull remaining. Repack the force and choose another route.`;
    $('#run-end-stats').innerHTML = `<span>HULL LEFT<b>${this.run.hull}</b></span><span>POINT LIMIT<b>${this.run.cap}</b></span>`;
    $('#run-end-button').textContent = 'REBUILD FORCE';
    $('#run-end-button').dataset.action = 'retry';
    $('#run-end-dialog').showModal();
  }

  endRun(victory) {
    const earned = this.run.chests;
    this.meta.currency += earned;
    if (victory) this.meta.wins++;
    const snapshot = { battles:this.run.battles, bosses:this.run.bosses, data:this.run.data, chests:earned };
    this.run = null;
    this.save();
    $('#run-end-kicker').textContent = victory ? '// EXPEDITION COMPLETE' : '// EXPEDITION LOST';
    $('#run-end-title').textContent = victory ? 'THE FRONT BREAKS.' : 'THE SIGNAL GOES DARK.';
    $('#run-end-copy').textContent = victory ? 'The Null Citadel falls. Temporary protocols are purged; recovered War Chests remain for permanent research.' : 'The strike case is gone, but recovered War Chests have reached command.';
    $('#run-end-stats').innerHTML = `<span>BATTLES WON<b>${snapshot.battles}</b></span><span>BOSSES BROKEN<b>${snapshot.bosses}</b></span><span>RUN DATA<b>${snapshot.data}</b></span><span>WAR CHESTS<b>+${snapshot.chests}</b></span>`;
    $('#run-end-button').textContent = 'RETURN TO COMMAND';
    $('#run-end-button').dataset.action = 'home';
    $('#run-end-dialog').showModal();
  }

  handleEndButton() {
    const action = $('#run-end-button').dataset.action;
    $('#run-end-dialog').close();
    if (action === 'retry' && this.run) this.openLoadout('map');
    else { this.renderHome(); this.show('home'); }
  }

  renderResearch() {
    $('#research-currency').textContent = this.meta.currency;
    const grid = $('#research-grid');
    grid.innerHTML = '';
    for (const research of RESEARCH) {
      const level = this.meta.research[research.id] || 0;
      const cost = research.costs[level];
      const card = document.createElement('article');
      card.className = 'research-card';
      card.innerHTML = `<span class="research-icon">${research.icon}</span><div><h3>${research.name} <span class="research-level">LV ${level}/${research.max}</span></h3><p>${research.desc}</p></div>`;
      const button = document.createElement('button');
      button.textContent = level >= research.max ? 'MAX' : `${cost} BUY`;
      button.disabled = level >= research.max || this.meta.currency < cost;
      button.onclick = () => this.buyResearch(research.id);
      card.append(button);
      grid.append(card);
    }
  }

  buyResearch(id) {
    const research = RESEARCH.find(item => item.id === id);
    const level = this.meta.research[id] || 0;
    const cost = research.costs[level];
    if (level >= research.max || this.meta.currency < cost) return;
    this.meta.currency -= cost;
    this.meta.research[id] = level + 1;
    this.save();
    this.renderResearch();
  }
}
