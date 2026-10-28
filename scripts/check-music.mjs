import assert from 'node:assert/strict';
import fs from 'node:fs';
import {createHash} from 'node:crypto';
import {SCORE,renderTrack,encodeWav} from '../tools/render-combat-patrol-bgm.mjs';
import {MusicSystem,MUSIC_URL} from '../js/core/MusicSystem.js';

const a=renderTrack({rate:8000}), b=renderTrack({rate:8000});
const wav=encodeWav(a), hash=bytes=>createHash('sha256').update(bytes).digest('hex');
assert.equal(hash(wav),hash(encodeWav(b)),'same seed produces identical PCM');
assert.notEqual(hash(wav),hash(encodeWav(renderTrack({rate:8000,seed:SCORE.seed+1}))),'seed influences synthesis');
assert.equal(a.channels[0].length,64*8000);
assert.equal(SCORE.bpm,60);assert.equal(SCORE.beatsPerBar,4);
assert.equal(SCORE.bars*SCORE.beatsPerBar*60/SCORE.bpm,SCORE.duration,'16-bar litany is exactly 64 seconds');
assert.equal(wav.toString('ascii',0,4),'RIFF');
assert.equal(wav.readUInt16LE(22),2,'stereo master');
assert.equal(wav.readUInt16LE(34),16,'16-bit master');
let stereoDifference=0;
for(let ch=0;ch<2;ch++) {
  const samples=a.channels[ch];let peak=0,energy=0,edgeEnergy=0;
  for(let i=0;i<samples.length;i++) {
    assert.ok(Number.isFinite(samples[i]));
    peak=Math.max(peak,Math.abs(samples[i]));energy+=samples[i]**2;
    if(i<800 || i>=samples.length-800)edgeEnergy+=samples[i]**2;
    if(!ch)stereoDifference+=Math.abs(samples[i]-a.channels[1][i]);
  }
  assert.ok(peak<=10**(-2.19/20),'master headroom');
  assert.ok(energy/samples.length>.001,'not silent');
  // Adjacent-sample slopes grow at a lower test rate; use the same time scale.
  assert.ok(Math.abs(samples[0]-samples.at(-1))<.012*(44100/a.rate),'no discontinuous seam');
  assert.ok(edgeEnergy/1600>.0005,'tail and opening retain sound, not a silence fade');
}
assert.ok(stereoDifference>100,'genuine stereo arrangement');
const masterFile=new URL('../output/audio/combat-patrol-bgm.wav',import.meta.url);
if(fs.existsSync(masterFile)) {
  const master=fs.readFileSync(masterFile);
  for(let ch=0;ch<2;ch++) assert.ok(Math.abs(master.readInt16LE(44+ch*2)-master.readInt16LE(master.length-4+ch*2))/32768<.004,'production master seam remains below -48 dBFS');
}
assert.match(MUSIC_URL,/\.m4a\?v=20261028-3$/,'replacement track has a fresh cache revision');
const metrics=JSON.parse(fs.readFileSync(new URL('../assets/audio/combat-patrol-bgm.metrics.json',import.meta.url)));
assert.equal(metrics.duration,64);assert.equal(metrics.channels,2);
assert.ok(metrics.truePeakDBTP>=-2.05 && metrics.truePeakDBTP<=-1.5);
assert.equal(metrics.bytes,fs.statSync(new URL('../assets/audio/combat-patrol-bgm.m4a',import.meta.url)).size);

function mockContext() {
  return {sources:[],resumeCount:0,suspendCount:0,closed:false,destination:{},
    resume(){this.resumeCount++;return Promise.resolve();},suspend(){this.suspendCount++;return Promise.resolve();},
    close(){this.closed=true;return Promise.resolve();},
    createGain(){return {gain:{value:0},connect(){},disconnect(){}};},
    decodeAudioData(){return Promise.resolve({duration:64.02});},
    createBufferSource(){const source={starts:0,connect(){},disconnect(){},start(){this.starts++;},stop(){this.stopped=true;}};this.sources.push(source);return source;}};
}
const ctx=mockContext();let requests=0;
const music=new MusicSystem({contextFactory:()=>ctx,fetcher:async()=>{requests++;return {ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};}});
assert.equal(ctx.resumeCount,0,'no autoplay before gesture');
await Promise.all([music.activate(),music.activate(),music.activate()]);
assert.equal(requests,1);assert.equal(ctx.sources.length,1,'concurrent gestures cannot stack music');
assert.equal(ctx.sources[0].loopEnd,64,'exclude possible AAC padding');
assert.equal(ctx.sources[0].loop,true);
music.setMuted(true);assert.equal(music.gain.gain.value,0);assert.ok(ctx.suspendCount>0);
music.setMuted(false);await music.activate();assert.equal(ctx.sources.length,1,'mute resumes same score');
music.setHidden(true);const previous=ctx.resumeCount;await music.activate();assert.equal(ctx.resumeCount,previous);
music.setHidden(false);await music.activate();assert.equal(ctx.sources.length,1);
music.dispose();await music.activate();assert.ok(ctx.closed && ctx.sources[0].stopped);

let finishFetch;const loadingContext=mockContext();
const duringLoad=new MusicSystem({contextFactory:()=>loadingContext,fetcher:()=>new Promise(resolve=>{finishFetch=resolve;})});
const started=duringLoad.activate();duringLoad.setMuted(true);
finishFetch({ok:true,arrayBuffer:async()=>new ArrayBuffer(4)});await started;
assert.equal(loadingContext.sources.length,0,'mute while loading cannot start late audio');
duringLoad.setMuted(false);await duringLoad.activate();assert.equal(loadingContext.sources.length,1);
duringLoad.dispose();
let failures=0, attempts=0;
const retry=new MusicSystem({contextFactory:mockContext,fetcher:async()=>{if(!attempts++)throw new Error('offline');return {ok:true,arrayBuffer:async()=>new ArrayBuffer(4)};},onError:()=>failures++});
await retry.activate();assert.equal(failures,1);await retry.activate();assert.equal(retry.source.starts,1);retry.dispose();
console.log('Music: deterministic stereo PCM, active loop seam, headroom, cache revision, autoplay gating, single-source playback, mute/visibility, loading races and retry passed.');
