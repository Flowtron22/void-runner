import { SYSTEM_DEFAULTS } from '../data/ships.js';
import { SPECIES } from '../data/crewSpecies.js';
import { shortestPath } from '../crew/CrewPathfinding.js';

const edgeKey = (a,b) => [a,b].sort().join('|');

export class Ship {
  constructor({ layout, hull, reactor, enemy=false }) {
    this.enemy = enemy; this.maxHull = hull; this.hull = hull; this.reactor = reactor; this.maxReactor = reactor;
    this.rooms = new Map(layout.map(r => [r.id, { ...r, oxygen:100, fire:0, breach:false, damage:0, crew:[], selected:false }]));
    this.systems = {};
    for (const room of this.rooms.values()) if (room.system) {
      const base = SYSTEM_DEFAULTS[room.system] || { max:1, power:1 };
      this.systems[room.system] = { roomId:room.id, max:base.max, health:base.max, power:enemy ? Math.min(base.max, base.power) : base.power };
    }
    this.doors = new Map();
    for (const room of this.rooms.values()) for (const neighbor of room.neighbors) {
      const key = edgeKey(room.id,neighbor);
      if (!this.doors.has(key)) this.doors.set(key,{ id:key, a:room.id, b:neighbor, open:true, progress:1 });
    }
    this.airlockOpen = false; this.shield = 1; this.shieldTimer = 0; this.crew=[];
  }

  addCrew({ id, name, species, roomId }) {
    const spec = SPECIES[species];
    const crew = { id,name,species,color:spec.color,maxHealth:spec.maxHealth,health:spec.maxHealth,repair:spec.repair,speed:spec.speed,currentRoom:roomId,targetRoom:roomId,path:[],moveProgress:0,dead:false,selected:false };
    this.crew.push(crew); this.rooms.get(roomId).crew.push(id); return crew;
  }

  isDoorOpen(a,b){ return this.doors.get(edgeKey(a,b))?.open ?? false; }
  toggleDoors(roomId){ for(const d of this.doors.values()) if(d.a===roomId||d.b===roomId) d.open=!d.open; }
  routeCrew(crew,toId){ const path=shortestPath(this.rooms,crew.currentRoom,toId,(a,b)=>this.isDoorOpen(a,b)); if(!path) return false; crew.path=path.slice(1); crew.targetRoom=toId; crew.moveProgress=0; return true; }
  usedPower(){ return Object.values(this.systems).reduce((sum,s)=>sum+s.power,0); }
  changePower(id,delta){ const s=this.systems[id]; if(!s) return false; const next=Math.max(0,Math.min(s.max,s.power+delta,s.health)); if(next> s.power && this.usedPower()>=this.reactor) return false; s.power=next; return true; }
  effective(system){ const s=this.systems[system]; return s ? Math.min(s.power,s.health) : 0; }

  update(dt){
    this.updateCrew(dt); this.updateAtmosphere(dt); this.updateShields(dt);
    for(const d of this.doors.values()) d.progress += ((d.open?1:0)-d.progress)*Math.min(1,dt*8);
  }

  updateCrew(dt){
    for(const crew of this.crew){
      if(crew.dead) continue;
      if(crew.path.length){
        const nextId=crew.path[0];
        if(!this.isDoorOpen(crew.currentRoom,nextId)){ crew.path=[]; crew.targetRoom=crew.currentRoom; continue; }
        crew.moveProgress += dt*crew.speed*.72;
        if(crew.moveProgress>=1){
          const old=this.rooms.get(crew.currentRoom); old.crew=old.crew.filter(id=>id!==crew.id);
          crew.currentRoom=nextId; this.rooms.get(nextId).crew.push(crew.id); crew.path.shift(); crew.moveProgress=0;
        }
      } else {
        const room=this.rooms.get(crew.currentRoom);
        if(room.fire>0) room.fire=Math.max(0,room.fire-dt*12*crew.repair);
        else if(room.damage>0){ const amount=dt*.22*crew.repair; room.damage=Math.max(0,room.damage-amount); const sys=room.system&&this.systems[room.system]; if(sys) sys.health=Math.min(sys.max,sys.health+amount); }
        if(room.system==='medbay'&&this.effective('medbay')>0) crew.health=Math.min(crew.maxHealth,crew.health+dt*5);
        if(room.fire>0) crew.health-=dt*5.5;
        if(room.oxygen<20 && crew.species!=='voidborn') crew.health-=dt*(20-room.oxygen)*.16;
        if(crew.health<=0){ crew.health=0; crew.dead=true; room.crew=room.crew.filter(id=>id!==crew.id); }
      }
    }
  }

  updateAtmosphere(dt){
    const oxygenPowered=this.effective('oxygen')>0;
    for(const room of this.rooms.values()){
      if(oxygenPowered && !room.breach && !(room.airlock&&this.airlockOpen)) room.oxygen+=dt*1.8;
      if(room.breach || (room.airlock&&this.airlockOpen)) room.oxygen-=dt*24;
      if(room.fire>0){ room.oxygen-=dt*(1.4+room.fire*.025); room.fire += room.oxygen>15 ? dt*.7 : -dt*6; }
      room.oxygen=Math.max(0,Math.min(100,room.oxygen)); room.fire=Math.max(0,Math.min(100,room.fire));
    }
    for(const door of this.doors.values()) if(door.open){
      const a=this.rooms.get(door.a),b=this.rooms.get(door.b),flow=(a.oxygen-b.oxygen)*dt*.12;
      a.oxygen-=flow;b.oxygen+=flow;
    }
  }

  updateShields(dt){
    const capacity=this.effective('shields')>=2?2:this.effective('shields');
    this.shield=Math.min(this.shield,capacity);
    if(this.shield<capacity){ this.shieldTimer+=dt; if(this.shieldTimer>=7){this.shield++;this.shieldTimer=0;} }
  }

  takeHit(roomId,damage,shieldDamage=1){
    if(this.shield>0){ this.shield=Math.max(0,this.shield-shieldDamage); this.shieldTimer=0; return { shield:true, damage:0 }; }
    const room=this.rooms.get(roomId)||[...this.rooms.values()][0];
    this.hull=Math.max(0,this.hull-damage); room.damage=Math.min(3,room.damage+damage*.45);
    const sys=room.system&&this.systems[room.system]; if(sys){ sys.health=Math.max(0,sys.health-damage*.55); sys.power=Math.min(sys.power,Math.ceil(sys.health)); }
    if(Math.random()<.24) room.fire=Math.max(room.fire,28); if(Math.random()<.12) room.breach=true;
    return { shield:false, damage, room };
  }
}
