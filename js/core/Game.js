import * as THREE from 'three';
import { Ship } from '../ship/Ship.js';
import { PLAYER_LAYOUT, ENEMY_LAYOUT } from '../data/ships.js';
import { WEAPONS } from '../data/weapons.js';
import { SceneManager } from '../render/SceneManager.js';
import { AudioSystem } from './AudioSystem.js';

export class Game {
  constructor(){
    this.state='COMBAT'; this.started=false; this.paused=false; this.ended=false; this.scrap=18; this.missiles=4; this.elapsed=0; this.shots=0; this.salvos=[];this.audio=new AudioSystem();
    this.player=new Ship({layout:PLAYER_LAYOUT,hull:30,reactor:10});
    this.enemy=new Ship({layout:ENEMY_LAYOUT,hull:18,reactor:8,enemy:true});
    this.scene=new SceneManager(document.querySelector('#game-canvas'),data=>this.handlePick(data));
    this.scene.buildShip(this.player,{offsetZ:5.15,scale:.88}); this.scene.buildShip(this.enemy,{offsetZ:-7.2,scale:.7,enemy:true});
    this.player.addCrew({id:'crew_nova',name:'Nova',species:'human',roomId:'bridge'});
    this.player.addCrew({id:'crew_ix',name:'IX-4',species:'mechanist',roomId:'engine'});
    this.player.addCrew({id:'crew_bram',name:'Bram',species:'brute',roomId:'weapons'});
    for(const c of this.player.crew)this.scene.addCrew(this.player,c);
    this.enemy.addCrew({id:'enemy_1',name:'Warden',species:'human',roomId:'e_weapons'});
    this.enemy.addCrew({id:'enemy_2',name:'Warden',species:'mechanist',roomId:'e_shields'});
    this.weapons=[this.makeWeapon(WEAPONS.pulse),this.makeWeapon(WEAPONS.cannon)];
    this.enemyWeapons=[this.makeWeapon(WEAPONS.enemyLaser),this.makeWeapon(WEAPONS.enemyCannon)];
    this.selectedCrew=null;this.selectedRoom=null;this.armedWeapon=null;this.last=performance.now();this.acc=0;this.step=1/30;
    this.bindUI();this.updateUI();this.loop=this.loop.bind(this);requestAnimationFrame(this.loop);
    document.querySelector('#intro-dialog').showModal();
  }

  makeWeapon(data){return{...data,charge:0,ready:false};}
  bindUI(){
    document.querySelector('#start-button').onclick=()=>{this.audio.unlock();document.querySelector('#intro-dialog').close();this.started=true;this.toast('ENGAGEMENT LIVE');};
    document.querySelector('#restart-button').onclick=()=>location.reload();
    document.querySelector('#pause-button').onclick=()=>this.togglePause();
    document.addEventListener('keydown',e=>{if(e.code==='Space'&&!e.repeat){e.preventDefault();this.togglePause();}if(e.key==='F1'){e.preventDefault();const p=document.querySelector('#debug-panel');p.hidden=!p.hidden;}});
    for(const b of document.querySelectorAll('.tabs button'))b.onclick=()=>this.setTab(b.dataset.tab);
    document.querySelector('#door-control').onclick=()=>{if(this.selectedRoom){this.player.toggleDoors(this.selectedRoom.id);this.audio.tone('door');this.toast('CONNECTED DOORS CYCLED');}};
    document.querySelector('#vent-control').onclick=()=>{if(this.selectedRoom?.airlock){this.player.airlockOpen=!this.player.airlockOpen;this.toast(this.player.airlockOpen?'AIRLOCK OPEN — VENTING':'AIRLOCK SEALED');}};
    document.querySelector('#debug-panel').onclick=e=>{const a=e.target.dataset.debug;if(!a)return;if(a==='scrap')this.scrap+=100;if(a==='repair')this.player.hull=this.player.maxHull;if(a==='fire')this.randomRoom(this.player).fire=60;if(a==='breach')this.randomRoom(this.player).breach=true;if(a==='damage'){const r=this.randomRoom(this.player);this.player.takeHit(r.id,2);}if(a==='kill')this.enemy.hull=0;this.updateUI();};
  }

  setTab(id){for(const b of document.querySelectorAll('.tabs button'))b.classList.toggle('active',b.dataset.tab===id);for(const p of document.querySelectorAll('.panel'))p.classList.toggle('active',p.dataset.panel===id);}
  togglePause(){if(!this.started||this.ended)return;this.paused=!this.paused;document.body.classList.toggle('paused',this.paused);document.querySelector('#pause-button').innerHTML=this.paused?'▶ RESUME <kbd>SPACE</kbd>':'Ⅱ PAUSE <kbd>SPACE</kbd>';}
  selectCrew(id){const crew=this.player.crew.find(c=>c.id===id&&!c.dead);if(!crew)return;this.selectedCrew=crew;for(const c of this.player.crew)c.selected=c===crew;this.setTab('crew');this.updateUI();}

  handlePick(data){
    if(this.ended)return;
    if(data.type==='crew'&&data.ship===this.player){this.selectCrew(data.id);return;}
    if(data.type==='door'&&data.ship===this.player){const d=this.player.doors.get(data.id);d.open=!d.open;this.audio.tone('door');this.toast(d.open?'DOOR OPEN':'DOOR SEALED');return;}
    if(data.type!=='room')return;
    const ship=data.enemy?this.enemy:this.player;const room=ship.rooms.get(data.id);
    if(data.enemy&&this.armedWeapon){this.firePlayerWeapon(this.armedWeapon,room);return;}
    if(data.enemy){this.toast('ARM A READY WEAPON FIRST');this.setTab('weapons');return;}
    for(const r of this.player.rooms.values())r.selected=false;room.selected=true;this.selectedRoom=room;
    if(this.selectedCrew&&this.selectedCrew.currentRoom!==room.id){if(this.player.routeCrew(this.selectedCrew,room.id))this.toast(`${this.selectedCrew.name.toUpperCase()} → ${room.name.toUpperCase()}`);else this.toast('NO OPEN ROUTE — CHECK DOORS');}
    this.updateUI();
  }

  firePlayerWeapon(weapon,room){
    if(!weapon.ready||this.player.effective('weapons')<weapon.power)return;
    weapon.charge=0;weapon.ready=false;this.armedWeapon=null;this.shots++;
    for(let i=0;i<weapon.shots;i++)this.salvos.push({delay:i*.22,source:this.player,target:this.enemy,weapon,roomId:room.id});
    this.audio.tone(weapon.id==='cannon'?'cannon':'laser');this.toast(`TARGET LOCK — ${room.name.toUpperCase()}`);this.updateUI();
  }

  launchShot(s){
    if(s.source.hull<=0||s.target.hull<=0)return;const sourceRoom=s.source.enemy?'e_weapons':'weapons';const from=this.scene.roomWorld(s.source,sourceRoom);const to=this.scene.roomWorld(s.target,s.roomId);const dir=to.clone().sub(from).normalize();from.add(dir.multiplyScalar(.5));
    this.scene.spawnProjectile({from,to,color:s.weapon.color,duration:.7,onHit:()=>this.resolveHit(s,to)});
  }
  resolveHit(s,pos){
    const evade=Math.min(.42,s.target.effective('engines')*.07+s.target.effective('bridge')*.035);
    if(Math.random()<evade){this.toast(s.target===this.player?'EVASIVE MANEUVER':'TARGET EVADED');return;}
    const result=s.target.takeHit(s.roomId,s.weapon.damage,s.weapon.shieldDamage);this.scene.impact(pos,result.shield?0x5df2dd:s.weapon.color);this.audio.tone(result.shield?'shield':'hit');
    if(!result.shield&&s.target===this.player)this.toast(`${result.room.name.toUpperCase()} HIT — ${s.weapon.damage} HULL`);
  }

  update(dt){
    this.elapsed+=dt;this.player.update(dt);this.enemy.update(dt);this.chargeWeapons(this.player,this.weapons,dt);this.chargeWeapons(this.enemy,this.enemyWeapons,dt);
    for(let i=this.salvos.length-1;i>=0;i--){this.salvos[i].delay-=dt;if(this.salvos[i].delay<=0){this.launchShot(this.salvos[i]);this.salvos.splice(i,1);}}
    for(const w of this.enemyWeapons)if(w.ready&&this.enemy.effective('weapons')>=w.power){w.charge=0;w.ready=false;const room=this.randomTargetRoom();for(let i=0;i<w.shots;i++)this.salvos.push({delay:i*.2,source:this.enemy,target:this.player,weapon:w,roomId:room.id});this.audio.tone('laser');}
    if(this.enemy.hull<=0)this.finish(true);else if(this.player.hull<=0||this.player.crew.every(c=>c.dead))this.finish(false);
  }

  chargeWeapons(ship,weapons,dt){let capacity=ship.effective('weapons');for(const w of weapons){if(capacity>=w.power){capacity-=w.power;if(!w.ready){w.charge=Math.min(w.cooldown,w.charge+dt);w.ready=w.charge>=w.cooldown;}}}}
  randomRoom(ship){const rooms=[...ship.rooms.values()].filter(r=>!r.airlock);return rooms[Math.floor(Math.random()*rooms.length)];}
  randomTargetRoom(){const urgent=[...this.player.rooms.values()].filter(r=>r.system&&Math.random()<.45);return urgent.length?urgent[Math.floor(Math.random()*urgent.length)]:this.randomRoom(this.player);}

  updateUI(){
    const p=this.player,e=this.enemy;document.querySelector('#hull-value').textContent=`${Math.ceil(p.hull)} / ${p.maxHull}`;document.querySelector('#hull-meter').style.width=`${p.hull/p.maxHull*100}%`;document.querySelector('#enemy-hull').textContent=`HULL ${Math.ceil(e.hull)} / ${e.maxHull}`;document.querySelector('#enemy-shields').textContent=`SHIELDS ${'◉'.repeat(e.shield)}${'○'.repeat(Math.max(0,2-e.shield))}`;document.querySelector('#scrap-value').textContent=this.scrap;document.querySelector('#missile-value').textContent=this.missiles;
    const room=this.selectedRoom;document.querySelector('#room-name').textContent=room?.name||'None';document.querySelector('#room-oxygen').textContent=room?`O₂ ${Math.round(room.oxygen)}%`:'O₂ —';document.querySelector('#room-system').textContent=room?.system?`${room.system.toUpperCase()} ${Math.max(0,Math.round((this.player.systems[room.system]?.health||0)*10)/10)}`:'SYSTEM —';document.querySelector('#door-control').disabled=!room;document.querySelector('#vent-control').disabled=!room?.airlock;document.querySelector('#vent-control').textContent=p.airlockOpen?'Seal airlock':'Open airlock';
    document.querySelector('#target-hint').textContent=this.armedWeapon?'TAP ENEMY ROOM':'ARM A WEAPON';
    this.renderCrewUI();this.renderPowerUI();this.renderWeaponUI();
  }

  renderCrewUI(){const box=document.querySelector('#crew-list');box.innerHTML='';for(const c of this.player.crew){const b=document.createElement('button');b.className=`crew-card ${c.selected?'active':''}`;b.style.setProperty('--crew',`#${c.color.toString(16).padStart(6,'0')}`);const room=this.player.rooms.get(c.currentRoom);b.innerHTML=`<i class="crew-dot"></i><span><b>${c.name}${c.dead?' / LOST':''}</b><small>${c.species.toUpperCase()} · ${room.name}</small></span><i class="health"><i style="width:${c.health/c.maxHealth*100}%"></i></i>`;b.disabled=c.dead;b.onclick=()=>this.selectCrew(c.id);box.append(b);}}
  renderPowerUI(){const box=document.querySelector('#power-grid');box.innerHTML='';document.querySelector('#reactor-value').textContent=`${this.player.usedPower()} / ${this.player.reactor}`;for(const [id,s] of Object.entries(this.player.systems)){const el=document.createElement('div');el.className='power-item';el.innerHTML=`<span>${id.toUpperCase()}<small> ${s.power}/${s.max}</small></span><button data-d="-1">−</button><button data-d="1">+</button>`;for(const b of el.querySelectorAll('button'))b.onclick=()=>{if(!this.player.changePower(id,Number(b.dataset.d)))this.toast('INSUFFICIENT REACTOR CAPACITY');this.updateUI();};box.append(el);}}
  renderWeaponUI(){const box=document.querySelector('#weapon-list');box.innerHTML='';for(const w of this.weapons){const b=document.createElement('button');b.className=`weapon-card ${w.ready?'ready':''} ${this.armedWeapon===w?'armed':''}`;const pct=w.ready?100:w.charge/w.cooldown*100;b.innerHTML=`<span><b>${w.name}</b><small>${w.damage} DMG · ${w.power} POWER · ${w.shots} SHOT${w.shots>1?'S':''}</small></span><b>${w.ready?'READY':Math.ceil(w.cooldown-w.charge)+'s'}</b><i class="charge"><i style="width:${pct}%"></i></i>`;b.disabled=!w.ready;b.onclick=()=>{this.armedWeapon=this.armedWeapon===w?null:w;this.toast(this.armedWeapon?'SELECT ENEMY SYSTEM':'TARGETING CANCELLED');this.updateUI();};box.append(b);}}
  toast(text){const el=document.querySelector('#toast');el.textContent=text;el.classList.add('show');clearTimeout(this.toastTimer);this.toastTimer=setTimeout(()=>el.classList.remove('show'),1500);}

  finish(win){if(this.ended)return;this.ended=true;this.state=win?'VICTORY':'GAME_OVER';this.paused=false;document.body.classList.remove('paused');this.audio.tone(win?'win':'lose');const d=document.querySelector('#end-dialog');document.querySelector('#end-eyebrow').textContent=win?'HOSTILE SIGNAL LOST':'COURIER SIGNAL LOST';document.querySelector('#end-title').textContent=win?'The route is open.':'The data goes dark.';document.querySelector('#end-copy').textContent=win?'The Warden cutter fractures into the void. Aster Vale can continue its run.':'The courier is disabled before it can clear the blockade.';document.querySelector('#end-stats').textContent=`TIME ${Math.floor(this.elapsed/60)}:${String(Math.floor(this.elapsed%60)).padStart(2,'0')} · HULL ${Math.ceil(this.player.hull)} · VOLLEYS ${this.shots}`;d.showModal();}
  loop(now){const frame=Math.min(.1,(now-this.last)/1000);this.last=now;if(this.started&&!this.paused&&!this.ended){this.acc+=frame;while(this.acc>=this.step){this.update(this.step);this.acc-=this.step;}}this.scene.update(this.started&&!this.paused&&!this.ended?frame:0,this.player,this.enemy);this.scene.render();if(now-(this.lastUi||0)>200){this.updateUI();this.lastUi=now;}requestAnimationFrame(this.loop);}
}
