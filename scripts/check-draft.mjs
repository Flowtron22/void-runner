import assert from 'node:assert/strict';
import fs from 'node:fs';
import { placementIssue } from '../js/core/DraftPlacement.js';
import { bindDraftDrag } from '../js/ui/DraftDrag.js';
const roster=JSON.parse(fs.readFileSync(new URL('../public/data/warhammer-roster.json',import.meta.url)));
const units=roster.factions.flatMap(f=>f.units);
const knights=roster.factions.find(f=>f.id==='grey-knights').units;
const unit=knights[0];
const input={unit,unlocked:true,deployed:[],cap:500,used:0,x:0,y:0,rotated:false,unitFor:id=>units.find(u=>u.id===id)};
assert.equal(placementIssue(input),null);
for(const [x,y] of [[-1,0],[0,-1],[5,0],[0,4],[.5,0]]) assert.ok(placementIssue({...input,x,y}));
const occupied=[{unitId:unit.id,x:0,y:0,rotated:false}];
assert.match(placementIssue({...input,deployed:occupied}),/OCCUPIED/);
assert.equal(placementIssue({...input,deployed:occupied,x:2}),null);
assert.match(placementIssue({...input,used:500}),/POINTS/);
assert.match(placementIssue({...input,unlocked:false}),/UNRECOVERED/);
assert.match(placementIssue({...input,deployed:Array.from({length:unit.stock},()=>occupied[0])}),/COPIES/);
const terminator=knights[1];
assert.ok(placementIssue({...input,unit:terminator,x:4}));
assert.equal(placementIssue({...input,unit:terminator,x:4,rotated:true}),null);
assert.deepEqual(occupied,[{unitId:unit.id,x:0,y:0,rotated:false}],'validation must never mutate formation');
assert.equal(knights.length,14);
assert.equal(knights.filter(u=>u.startingAvailable).length,4);
for(const u of knights) {
  assert.ok(u.datasheet.source.startsWith('https://wahapedia.ru/'));
  assert.ok(u.datasheet.weapons.length>0);
  for(const w of u.datasheet.weapons) {
    assert.ok(Number.isFinite(w.range) && Number.isFinite(w.strength) && Number.isFinite(w.ap),`${u.id}: invalid weapon`);
    assert.ok(w.attacks && w.damage);
  }
  if(u.leader) {assert.ok(u.leader.targets.length); for(const id of u.leader.targets) assert.ok(knights.some(u=>u.id===id));}
}
assert.equal(knights.find(u=>u.id==='grey-knight-paladins').models,4);
assert.equal(new Set(units.map(u=>u.id)).size,units.length);
// Exercise the pointer lifecycle without requiring a GPU or browser-specific drag API.
let preview=null, ghostCount=0, clicks=0, drops=[];
const status={textContent:''};
const node=()=>({style:{},classList:{toggle(){}},setAttribute(){},removeAttribute(){},remove(){ghostCount--;}});
const grid={getBoundingClientRect:()=>({left:0,top:0,right:310,bottom:208,width:310,height:208}),querySelector:()=>preview,append(el){preview=el;el.remove=()=>{preview=null;};}};
globalThis.document={querySelector:selector=>selector.includes('draft-preview')?preview:selector==='#formation-grid'?grid:status,createElement:node,body:{append(){ghostCount++;},classList:{add(){},remove(){}}}};
const listeners={};
const card={style:{},parentElement:{scrollTop:0},offsetWidth:70,offsetHeight:110,setPointerCapture(){},addEventListener(type,fn){listeners[type]=fn;},cloneNode:node};
const game={sizeFor:()=>unit.size,draftIssue:(u,x,y)=>placementIssue({...input,unit:u,x,y}),placeUnit:(x,y)=>drops.push([x,y])};
bindDraftDrag(card,unit,game);
const pointer=(type,x,y)=>({button:0,pointerType:type,pointerId:1,clientX:x,clientY:y});
const click=()=>{let stopped=false;listeners.click({preventDefault(){},stopImmediatePropagation(){stopped=true;}});if(!stopped) clicks++;};
card.onpointerdown(pointer('touch',30,300));card.onpointerup(pointer('touch',30,300));click();assert.equal(clicks,1,'tap opens datasheet');
card.onpointerdown(pointer('touch',30,300));card.onpointermove(pointer('touch',30,270));card.onpointerup(pointer('touch',30,270));click();assert.equal(card.parentElement.scrollTop,30);assert.equal(clicks,1,'swipe must not inspect');
card.onpointerdown(pointer('touch',30,300));await new Promise(resolve=>setTimeout(resolve,260));card.onpointermove(pointer('touch',90,60));card.onpointerup(pointer('touch',90,60));click();assert.equal(drops.length,1,'held touch drops once');assert.equal(ghostCount,0);assert.equal(preview,null);assert.equal(clicks,1,'drop must not inspect');
card.onpointerdown(pointer('mouse',30,300));card.onpointermove(pointer('mouse',90,60));card.onpointercancel();assert.equal(drops.length,1,'cancel never places');assert.equal(ghostCount,0);
card.onpointerdown(pointer('mouse',30,300));card.onpointermove(pointer('mouse',90,350));card.onpointerup(pointer('mouse',90,350));assert.equal(drops.length,1,'outside drop never places');
delete globalThis.document;
console.log('Draft: bounds, rotation, collisions, points, locks, stock and expanded datasheets passed.');
