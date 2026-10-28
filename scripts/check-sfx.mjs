import assert from 'node:assert/strict';
import {AudioSystem,SFX_NAMES} from '../js/core/AudioSystem.js';

const parameter=()=>({value:0,setValueAtTime(){},exponentialRampToValueAtTime(){},setTargetAtTime(){}});
const node=()=>({gain:parameter(),frequency:parameter(),detune:parameter(),connect(target){return target;},start(){},stop(){}});
const context={currentTime:0,sampleRate:8000,state:'running',destination:{},created:0,
  createGain(){this.created++;return node();},createOscillator(){this.created++;return node();},
  createDynamicsCompressor(){this.created++;return {threshold:parameter(),knee:parameter(),ratio:parameter(),attack:parameter(),release:parameter(),connect(target){return target;}};},
  createBuffer(){const data=new Float32Array(3200);return {getChannelData(){return data;}};},
  createBufferSource(){this.created++;return node();},createBiquadFilter(){this.created++;return {...node(),type:'',frequency:parameter()};},
  resume(){return Promise.resolve();},close(){this.state='closed';return Promise.resolve();}};

const sfx=new AudioSystem({contextFactory:context});
for(const required of ['hover','click','double','zoomIn','battleStart','dice','impactHeavy','victory','defeat'])
  assert.ok(SFX_NAMES.includes(required),`${required} cue is registered`);
for(const name of SFX_NAMES)assert.equal(sfx.play(name),true,`${name} renders`);
assert.ok(context.created>60,'layered cues create a substantial sound graph');
sfx.setMuted(true);assert.equal(sfx.play('click'),false,'muted effects do not render');
sfx.setMuted(false);assert.equal(sfx.play('click'),true,'effects resume after unmute');
sfx.dispose();assert.equal(context.state,'closed');
const suspended={...context,state:'suspended',created:0,resumeCount:0,
  resume(){this.resumeCount++;this.state='running';return Promise.resolve();},close(){this.state='closed';return Promise.resolve();}};
const firstGesture=new AudioSystem({contextFactory:suspended});
assert.equal(firstGesture.play('confirm'),true,'first gesture accepts a cue while suspended');
await Promise.resolve();
assert.equal(suspended.resumeCount,1,'first gesture resumes the context once');
assert.ok(suspended.created>3,'deferred first cue renders after resume');
firstGesture.dispose();
console.log('SFX: interaction, zoom, combat, economy and outcome cues render; mute and disposal passed.');
