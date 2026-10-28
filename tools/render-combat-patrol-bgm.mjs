// Vigil of the Void — original procedural score for COMBAT PATROL.
// Technical approach informed by PNT's renderer; harmony, melody and rhythm are new.
// npm run audio:render; optional --wav-only, --wav <path>, --out <path>.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

export const SCORE = Object.freeze({ title:'Vigil of the Void', bpm:120, bars:32, rate:44100, seed:0x56494749, duration:64 });
const TAU = Math.PI * 2;
const midi = note => 440 * 2 ** ((note - 69) / 12);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function renderTrack({ rate=SCORE.rate, seed=SCORE.seed }={}) {
  const length = Math.round(rate * SCORE.duration);
  const dry = [new Float64Array(length), new Float64Array(length)];
  const send = [new Float64Array(length), new Float64Array(length)];
  let state = seed >>> 0;
  const random = () => ((state = (Math.imul(state,1664525) + 1013904223) >>> 0) / 4294967296);
  const beat = 60 / SCORE.bpm, bar = beat * 4;
  // Circular writes preserve notes, percussion and reverberation across the seam.
  function write(index, value, pan=0, room=.3) {
    index = ((index % length) + length) % length;
    const l = value * Math.sqrt((1-pan)*.5), r = value * Math.sqrt((1+pan)*.5);
    dry[0][index] += l; dry[1][index] += r;
    send[0][index] += l*room; send[1][index] += r*room;
  }
  function voice(start, seconds, note, {kind='bow', amp=.04, pan=0, attack=.18, release=.4, room=.4}={}) {
    const offset = Math.round(start*rate), count = Math.round(seconds*rate), frequency=midi(note);
    const phaseOffset = random()*TAU;
    for (let i=0; i<count; i++) {
      const t=i/rate, p=t/seconds;
      const envelope=Math.sin(Math.min(1,t/attack)*Math.PI/2)*Math.sin(Math.min(1,(seconds-t)/release)*Math.PI/2);
      const vibrato = kind==='bass' ? 0 : .0035*Math.sin(TAU*4.7*t)*Math.min(1,t*.8);
      const phase=TAU*frequency*t + vibrato + phaseOffset;
      let value;
      if (kind==='pad') {
        value=.46*Math.sin(phase)+.28*Math.sin(phase+TAU*.14*t)+.16*Math.sin(phase-TAU*.19*t)+.07*Math.sin(phase*2)+.03*Math.sin(phase*3);
        value*=.92+.08*Math.sin(TAU*.125*t+phaseOffset);
      } else if (kind==='bass') {
        value=.86*Math.sin(phase)+.10*Math.sin(phase*2)+.04*Math.sin(phase*3);
      } else if (kind==='horn') {
        value=.64*Math.sin(phase)+.22*Math.sin(phase*2)+.10*Math.sin(phase*3)+.04*Math.sin(phase*4);
      } else {
        value=.72*Math.sin(phase)+.18*Math.sin(phase*2)+.07*Math.sin(phase*3)+.03*Math.sin(phase*4);
        value*=.96+.04*Math.sin(TAU*5.1*t);
      }
      write(offset+i,value*amp*envelope*(kind==='horn'?Math.sin(Math.PI*p)**.35:1),pan,room);
    }
  }
  function mallet(start, note, amp=.035, pan=0) {
    const offset=Math.round(start*rate), frequency=midi(note), seconds=2.6;
    for(let i=0;i<seconds*rate;i++) {
      const t=i/rate, attack=1-Math.exp(-t*210);
      const value=Math.sin(TAU*frequency*t)*Math.exp(-t*2.4)*.76
        +Math.sin(TAU*frequency*2.756*t)*Math.exp(-t*5)*.16
        +Math.sin(TAU*frequency*4.123*t)*Math.exp(-t*8)*.06
        +Math.sin(TAU*frequency*6.14*t)*Math.exp(-t*13)*.02;
      write(offset+i,value*amp*attack,pan,.72);
    }
  }
  function drum(start, {kind='kick', amp=.16, pan=0}={}) {
    const offset=Math.round(start*rate), seconds=kind==='snare'?.22:kind==='hat'?.11:.5;
    let phase=0, low=0, old=0;
    for(let i=0;i<seconds*rate;i++) {
      const t=i/rate, noise=random()*2-1;
      low+=.10*(noise-low);
      let value;
      if(kind==='kick') {
        phase+=TAU*(44+58*Math.exp(-t*32))/rate;
        value=Math.sin(phase)*Math.exp(-t*11)+low*.06*Math.exp(-t*30);
      } else if(kind==='snare') {
        value=(low*.82+Math.sin(TAU*174*t)*.18)*Math.exp(-t*20);
      } else if(kind==='hat') {
        value=(noise-old)*Math.exp(-t*52)*.16; old=noise;
      } else {
        phase+=TAU*(77+17*Math.exp(-t*16))/rate;
        value=(Math.sin(phase)*.92+low*.08)*Math.exp(-t*10);
      }
      write(offset+i,value*amp*Math.min(1,t*900),pan,kind==='kick'?.06:.25);
    }
  }

  // Eight four-bar harmonic fields: D minor/modal suspensions, not the PNT score.
  const roots=[38,34,41,36,31,34,33,33];
  const chords=[[50,53,57,64],[46,53,60,65],[53,57,60,67],[48,55,62,64],
    [43,50,57,62],[46,53,57,60],[45,52,55,62],[45,52,58,62]];
  const phrases=[
    [[1,74,2.1],[6,69,1.4],[11,72,2.4]],
    [[2,65,2.5],[8,67,1.4],[12,69,2.0]],
    [[0,72,2.6],[7,69,1.8],[12,67,2.2]],
    [[3,64,2.0],[8,67,2.6],[13,62,1.1]],
    [[1,69,2.8],[7,70,1.9],[12,65,2.3]],
    [[2,65,2.2],[8,69,2.4],[13,72,1.3]],
    [[0,67,2.7],[7,64,2.1],[12,62,2.0]],
    [[2,64,2.6],[8,61,1.8],[12,69,2.1]]
  ];
  for(let field=0;field<8;field++) {
    const start=field*4*bar;
    chords[field].forEach((note,i)=>voice(start,4*bar+1.5,note,{kind:'pad',amp:.046,pan:(i-1.5)*.29,attack:1.15,release:1.5,room:.56}));
    for(const [at,note,beats] of phrases[field]) {
      voice(start+at*beat,beats*beat+.55,note,{kind:'bow',amp:field>3?.032:.027,pan:.12,attack:.32,release:.55,room:.64});
    }
    for(const [at,interval,pan] of [[.5,24,-.46],[5.5,31,.48],[10,27,-.26],[14.5,36,.3]]) {
      mallet(start+at*beat,roots[field]+interval,.029+(field===4?.005:0),pan);
    }
    if([2,5,7].includes(field)) {
      voice(start+6*beat,3.8,roots[field]+19,{kind:'horn',amp:.027,pan:-.18,attack:.8,release:1.1,room:.62});
      voice(start+11*beat,2.9,roots[field]+24,{kind:'horn',amp:.019,pan:.2,attack:.7,release:1.1,room:.65});
    }
  }
  for(let b=0;b<SCORE.bars;b++) {
    const start=b*bar, field=Math.floor(b/4), root=roots[field];
    drum(start,{amp:.19});
    // One soft backbeat on beat THREE: true half-time, rather than beats 2 and 4.
    drum(start+2*beat,{kind:'snare',amp:.15,pan:.04});
    if(b%2===1) drum(start+3.5*beat,{amp:.085});
    drum(start+1.5*beat,{kind:'tundra',amp:.065,pan:-.3});
    if(b%4===3) drum(start+3.25*beat,{kind:'tundra',amp:.052,pan:.29});
    for(const at of [0,1,2,3]) drum(start+(at+.5)*beat,{kind:'hat',amp:.035,pan:at%2?.32:-.32});
    voice(start,1.55*beat,root,{kind:'bass',amp:.12,pan:-.025,attack:.035,release:.24,room:.05});
    voice(start+2.5*beat,1.35*beat,root+(b%4===3?7:0),{kind:'bass',amp:.079,pan:.025,attack:.045,release:.22,room:.08});
  }

  // Diffuse, low-passed stereo room; every tap wraps into the next loop.
  const taps=[[.037,.23],[.071,.19],[.149,.16],[.223,.14],[.373,.11],[.557,.08],[.823,.06],[1.171,.035]];
  for(let ch=0;ch<2;ch++) {
    let low=0;
    const filtered=new Float64Array(length), input=send[ch];
    for(let pass=0;pass<2;pass++) for(let i=0;i<length;i++) {low+=.16*(input[i]-low);if(pass)filtered[i]=low;}
    for(let n=0;n<taps.length;n++) {
      const [delay,gain]=taps[n], shift=Math.round((delay+ch*.009*(n%3))*rate), out=dry[n%2?1-ch:ch];
      for(let i=0;i<length;i++) out[(i+shift)%length]+=filtered[i]*gain;
    }
  }
  const result=[new Float32Array(length),new Float32Array(length)];
  const hp=Math.exp(-TAU*24/rate), lp=1-Math.exp(-TAU*10500/rate);
  let peak=0;
  for(let ch=0;ch<2;ch++) {
    let previous=0, high=0, low=0;
    // First pass settles the periodic filter state; second writes one steady loop.
    for(let pass=0;pass<2;pass++) for(let i=0;i<length;i++) {
      const sample=Math.tanh(dry[ch][i]*1.12);
      high=hp*(high+sample-previous);previous=sample;low+=lp*(high-low);
      if(pass) {result[ch][i]=low;peak=Math.max(peak,Math.abs(low));}
    }
  }
  const gain=10**(-2.2/20)/Math.max(peak,.0001);
  for(const channel of result) for(let i=0;i<length;i++) channel[i]*=gain;
  return {channels:result,rate,duration:SCORE.duration};
}

export function encodeWav({channels,rate}) {
  const length=channels[0].length, dataBytes=length*4, wav=Buffer.alloc(44+dataBytes);
  wav.write('RIFF');wav.writeUInt32LE(36+dataBytes,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);
  wav.writeUInt16LE(1,20);wav.writeUInt16LE(2,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*4,28);
  wav.writeUInt16LE(4,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(dataBytes,40);
  for(let i=0,offset=44;i<length;i++,offset+=4) for(let ch=0;ch<2;ch++) wav.writeInt16LE(Math.round(clamp(channels[ch][i],-1,1)*32767),offset+ch*2);
  return wav;
}

function runFFmpeg(binary,args) {
  const result=spawnSync(binary,['-hide_banner','-nostdin',...args],{encoding:'utf8',maxBuffer:8*1024*1024});
  if(result.error) throw result.error;
  if(result.status!==0) throw new Error(`FFmpeg failed: ${result.stderr}`);
  return result.stderr;
}
function measure(binary,file) {
  const text=runFFmpeg(binary,['-i',file,'-af','loudnorm=I=-20:TP=-1.8:LRA=9:print_format=json','-f','null','-']);
  const json=text.match(/\{\s*"input_i"[\s\S]*?\}/);
  if(!json) throw new Error('FFmpeg did not return loudness measurements.');
  const data=JSON.parse(json[0]);
  const volume=runFFmpeg(binary,['-i',file,'-af','volumedetect','-f','null','-']);
  return {integratedLUFS:Number(data.input_i),truePeakDBTP:Number(data.input_tp),
    averageDBFS:Number(volume.match(/mean_volume:\s*([\d.-]+)/)?.[1]),samplePeakDBFS:Number(volume.match(/max_volume:\s*([\d.-]+)/)?.[1])};
}

export function main(args=process.argv.slice(2)) {
  const root=fileURLToPath(new URL('../',import.meta.url));
  const option=(name,fallback)=>args.includes(name)?path.resolve(args[args.indexOf(name)+1]):path.join(root,fallback);
  const wavFile=option('--wav','output/audio/combat-patrol-bgm.wav');
  const outFile=option('--out','assets/audio/combat-patrol-bgm.m4a');
  const pcm=encodeWav(renderTrack());
  fs.mkdirSync(path.dirname(wavFile),{recursive:true});fs.writeFileSync(wavFile,pcm);
  const masterHash=createHash('sha256').update(pcm).digest('hex');
  if(args.includes('--wav-only')) {console.log(JSON.stringify({wavFile,duration:SCORE.duration,masterHash},null,2));return;}
  const require=createRequire(import.meta.url), binary=process.env.FFMPEG_PATH || require('ffmpeg-static');
  fs.mkdirSync(path.dirname(outFile),{recursive:true});
  let encodedGain=0, metrics;
  // Meter the encoded AAC, not just the master: AAC can introduce intersample overs.
  for(let attempt=0;attempt<4;attempt++) {
    runFFmpeg(binary,['-y','-i',wavFile,'-map_metadata','-1','-af',`volume=${encodedGain.toFixed(3)}dB`,
      '-c:a','aac','-b:a','192k','-ar','44100','-movflags','+faststart','-metadata',`title=${SCORE.title}`,
      '-metadata','artist=COMBAT PATROL — procedural original',outFile]);
    metrics=measure(binary,outFile);
    if(Math.abs(metrics.truePeakDBTP-(-1.8))<.09) break;
    encodedGain+=-1.8-metrics.truePeakDBTP;
  }
  if(metrics.truePeakDBTP> -1.5 || metrics.truePeakDBTP< -2.05) throw new Error('Encoded true peak outside requested range.');
  const report={...SCORE,channels:2,codec:'AAC-LC',targetBitrate:192000,...metrics,
    bytes:fs.statSync(outFile).size,masterSHA256:masterHash,encodedGainDB:Number(encodedGain.toFixed(3))};
  fs.writeFileSync(outFile.replace(/\.m4a$/i,'.metrics.json'),JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({wavFile,outFile,...report},null,2));
}
if(process.argv[1] && path.resolve(process.argv[1])===fileURLToPath(import.meta.url)) main();
