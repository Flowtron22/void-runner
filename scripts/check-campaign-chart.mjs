import assert from 'node:assert/strict';
import fs from 'node:fs';
import {buildSectorChart, chartState} from '../js/core/CampaignChart.js';
import {Game} from '../js/core/Game.js';
import {CAMPAIGN_TIERS} from '../js/data/units.js';

const roster = JSON.parse(fs.readFileSync(new URL('../public/data/warhammer-roster.json', import.meta.url)));
const game = Object.create(Game.prototype);
game.factions = roster.factions;
game.units = roster.factions.flatMap(f => f.units.map(unit => ({...unit, faction:f.id, color:f.color, mark:f.mark})));
game.meta = {research:{}};
game.save = () => {};
game.finishPostWarEvent = () => {};

for (const tierIndex of [0,1,3,4]) {
  game.run = {tierIndex,region:0,step:0,sectorStars:0,protocols:[],history:[],faction:'grey-knights'};
  const depth = CAMPAIGN_TIERS[tierIndex].depth;
  const chart = buildSectorChart({region:0, depth, step:0, history:[], makeLayer:step => game.makeOffers(step)});
  assert.equal(chart.layers.flat().length, (depth + 1)*3);
  assert(chart.layers.flat().some(node => node.event === 'distress'));
  const initial = chartState(chart, [], 0, 0, 0);
  assert.equal(initial.nodes.filter(node => !node.locked).length, 3);
  const left = {...initial.nodes[0],region:0,step:0};
  const next = chartState(chart, [left], 0, 1, 1);
  assert.deepEqual(next.nodes.filter(node => !node.locked).map(node => node.lane), [0,1]);
  assert.equal(next.nodes.find(node => node.id === left.id).status, 'complete');
  assert(next.nodes.filter(node => node.step > 1).every(node => node.locked));
  // Reload retains the whole network and reachable destinations.
  assert.deepEqual(chartState(JSON.parse(JSON.stringify(chart)), [left],0,1,1), next);
  const last = {...chart.layers[depth-1][1],region:0,step:depth-1};
  assert.equal(chartState(chart,[last],0,depth,0).nodes.filter(node => !node.locked).length,1);
  assert.equal(chartState(chart,[last],0,depth,depth*2).nodes.filter(node => !node.locked).length,3);
  // In-progress legacy offers retain their enemy, event, and all legal choices.
  const offers = game.makeOffers(1);
  const migrated = buildSectorChart({region:0,depth,step:1,history:[left],offers,makeLayer:step => game.makeOffers(step)});
  assert.equal(chartState(migrated,[left],0,1,1).nodes.filter(node => !node.locked).length,3);
  assert.equal(migrated.layers[1][0].enemyFaction, offers[0].enemyFaction);
  assert.equal(migrated.layers[1][2].event, offers[2].event);
  assert(initial.nodes[0].difficulty < initial.nodes[1].difficulty && initial.nodes[1].difficulty < initial.nodes[2].difficulty);
}

game.run = {tierIndex:0,protocols:[],rescuedUnits:[],pendingPostWar:{node:{id:'test-distress',event:'distress'}}};
const offer = game.distressOffer();
assert(offer.keywords.includes('Imperium'));
assert(offer.points <= game.getBaseCap());
assert.equal(offer.stock,1);
assert.equal(game.distressOffer().id, offer.id); // Reload/open cannot reroll a rescue.
game.claimDistressRescue(); game.claimDistressRescue();
assert.equal(game.run.rescuedUnits.length,1); // A repeated claim cannot duplicate it.
game.run = JSON.parse(JSON.stringify(game.run));
game.run.region = 7;
assert.equal(game.unit(offer.id).id,offer.id); // Survives reload and sector changes.
game.run = null;
assert.equal(game.unit(offer.id),undefined); // Never leaks into the next mission.

// The survivor event must resolve before route progression, once only.
const dialog = {open:false, close() { this.open=false; }};
globalThis.document = {querySelector: selector => selector === '#event-dialog' ? dialog : null};
game.run = {tierIndex:0,protocols:[],pendingPostWar:{node:{id:'rescue-gate',event:'distress'},wasBoss:false}};
game.distressOffer();
let reopened = 0, advanced = 0;
game.openDistressEvent = () => reopened++;
game.advanceRoute = () => advanced++;
game.finishPostWarEvent = Game.prototype.finishPostWarEvent;
game.finishPostWarEvent();
assert.equal(reopened,1); assert.equal(advanced,0);
game.claimDistressRescue(); game.claimDistressRescue();
assert.equal(advanced,1); assert.equal(game.run.rescuedUnits.length,1);
assert.equal(game.run.pendingPostWar,null);
delete globalThis.document;
console.log('Campaign chart: topology, migration, boss gates, saved rescues and mission lifetime passed.');
