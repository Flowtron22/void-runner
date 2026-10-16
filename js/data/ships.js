export const PLAYER_LAYOUT = [
  { id:'bridge', name:'Bridge', system:'bridge', x:0, z:-4.5, w:2.6, d:2.0, capacity:2, neighbors:['shields','weapons'] },
  { id:'shields', name:'Shields', system:'shields', x:-1.75, z:-1.9, w:2.5, d:2.3, capacity:2, neighbors:['bridge','medbay','engine'] },
  { id:'weapons', name:'Weapons', system:'weapons', x:1.75, z:-1.9, w:2.5, d:2.3, capacity:2, neighbors:['bridge','oxygen','engine'] },
  { id:'medbay', name:'Medbay', system:'medbay', x:-1.75, z:.8, w:2.5, d:2.1, capacity:2, neighbors:['shields','engine'] },
  { id:'oxygen', name:'Life Support', system:'oxygen', x:1.75, z:.8, w:2.5, d:2.1, capacity:2, neighbors:['weapons','engine'] },
  { id:'engine', name:'Drive Core', system:'engines', x:0, z:3.55, w:3.8, d:2.5, capacity:3, neighbors:['shields','weapons','medbay','oxygen','airlock'] },
  { id:'airlock', name:'Airlock', system:null, x:0, z:5.75, w:1.8, d:1.2, capacity:1, neighbors:['engine'], airlock:true }
];

export const ENEMY_LAYOUT = [
  { id:'e_bridge', name:'Command', system:'bridge', x:0, z:-1.9, w:2.1, d:1.5, neighbors:['e_shields','e_weapons'] },
  { id:'e_shields', name:'Barrier', system:'shields', x:-1.35, z:.15, w:2.0, d:1.8, neighbors:['e_bridge','e_engine'] },
  { id:'e_weapons', name:'Battery', system:'weapons', x:1.35, z:.15, w:2.0, d:1.8, neighbors:['e_bridge','e_engine'] },
  { id:'e_engine', name:'Drive', system:'engines', x:0, z:2.25, w:2.8, d:1.7, neighbors:['e_shields','e_weapons'] }
];

export const SYSTEM_DEFAULTS = {
  bridge:{ max:1, power:1 }, shields:{ max:2, power:2 }, weapons:{ max:4, power:4 }, medbay:{ max:1, power:0 }, oxygen:{ max:1, power:1 }, engines:{ max:2, power:1 }
};
