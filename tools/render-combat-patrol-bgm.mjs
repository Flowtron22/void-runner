// The Last Reliquary — original gothic organ/music-box waltz for COMBAT PATROL.
// Technical approach informed by PNT's renderer; harmony, melody and rhythm are new.
// npm run audio:render; optional --wav-only, --wav <path>, --out <path>.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

export const SCORE = Object.freeze({ title:'The Last Reliquary', bpm:90, beatsPerBar:3, bars:32, rate:44100, seed:0x52454c49, duration:64 });
const TAU = Math.PI * 2;
const midi = note => 440 * 2 ** ((note - 69) / 12);
const clamp = (n, a, b) => Math.max(a, Math.min(b, n));

export function renderTrack({ rate=SCORE.rate, seed=SCORE.seed }={}) {
  const length = Math.round(rate * SCORE.duration);
  const dry = [new Float64Array(length), new Float64Array(length)];
  const send = [new Float64Array(length), new Float64Array(length)];
  let state = seed >>> 0;
  const random = () => ((state = (Math.imul(state,1664525) + 1013904223) >>> 0) / 4294967296);
  const beat = 60 / SCORE.bpm, bar = beat * SCORE.beatsPerBar;
  // Circular writes preserve notes, percussion and reverberation across the seam.
  function write(index, value, pan=0, room=.3) {
    index = ((index % length) + length) % length;
    const l = value * Math.sqrt((1-pan)*.5), r = value * Math.sqrt((1+pan)*.5);
    dry[0][index] += l; dry[1][index] += r;
    send[0][index] += l*room; send[1][index] += r*room;
  }
  function voice(start, seconds, note, {kind='organ', amp=.04, pan=0, attack=.18, release=.4, room=.65}={}) {
    const offset = Math.round(start*rate), count = Math.round(seconds*rate), frequency=midi(note);
    const phaseOffset = random()*TAU;
    // Vowel-shaped harmonic bands approximate a distant, wordless human choir.
    // They are synthesized oscillators, not voice samples or an existing recording.
    const formants=Array.from({length:14},(_,i)=>{
      const partial=i+1, hz=frequency*partial;
      return (.12+1.2*Math.exp(-.5*((hz-620)/135)**2)+.7*Math.exp(-.5*((hz-1100)/190)**2)+.24*Math.exp(-.5*((hz-2350)/330)**2))/partial;
    });
    const formantSum=formants.reduce((a,b)=>a+b,0);
    let movingPhase=phaseOffset;
    for (let i=0; i<count; i++) {
      const t=i/rate;
      const envelope=Math.sin(Math.min(1,t/attack)*Math.PI/2)*Math.sin(Math.min(1,(seconds-t)/release)*Math.PI/2);
      movingPhase+=TAU*frequency*(1+(kind==='bow'?.003:kind==='choir'?.0018:0)*Math.sin(TAU*5.15*t)*Math.min(1,t))/rate;
      const phase=movingPhase;
      let value;
      if(kind==='organ') {
        // 16', 8', 4' and restrained mutation stops: steady pipes, no synth LFO.
        value=.12*Math.sin(phase*.5)+.48*Math.sin(phase)+.19*Math.sin(phase*2)
          +.10*Math.sin(phase*3)+.055*Math.sin(phase*4)+.025*Math.sin(phase*6)
          +.02*Math.sin(phase+TAU*.09*t);
      } else if(kind==='pedal') {
        value=.78*Math.sin(phase)+.16*Math.sin(phase*2)+.06*Math.sin(phase*3);
      } else if(kind==='choir') {
        value=0;
        for(let h=0;h<formants.length;h++) value+=formants[h]*Math.sin(phase*(h+1));
        value/=formantSum;
        value*=.94+.06*Math.sin(TAU*.31*t+phaseOffset);
      } else {
        value=(Math.sin(phase)+.45*Math.sin(phase*2)+.27*Math.sin(phase*3)+.16*Math.sin(phase*4)
          +.11*Math.sin(phase*5)+.07*Math.sin(phase*6)+.04*Math.sin(phase*7)+.03*Math.sin(phase*8))/2.13;
        value*=.97+.03*Math.sin(TAU*5.6*t);
      }
      write(offset+i,value*amp*envelope,pan,room);
    }
  }
  function musicBox(start, note, amp=.10, pan=0) {
    const offset=Math.round(start*rate), frequency=midi(note), seconds=4.2;
    for(let i=0;i<seconds*rate;i++) {
      const t=i/rate, attack=1-Math.exp(-t*400);
      const value=Math.sin(TAU*frequency*t)*Math.exp(-t*1.55)*.68
        +Math.sin(TAU*frequency*2*t)*Math.exp(-t*2.7)*.16
        +Math.sin(TAU*frequency*3.997*t)*Math.exp(-t*4.9)*.10
        +Math.sin(TAU*frequency*5.403*t)*Math.exp(-t*8)*.045
        +Math.sin(TAU*frequency*8.105*t)*Math.exp(-t*13)*.015;
      write(offset+i,value*amp*attack*Math.min(1,(seconds-t)/.14),pan,.67);
    }
  }
  function timpani(start, note, amp=.08) {
    const offset=Math.round(start*rate), seconds=2.4, frequency=midi(note);
    for(let i=0;i<seconds*rate;i++) {
      const t=i/rate;
      const body=Math.sin(TAU*frequency*t)*Math.exp(-t*2.6)
        +.24*Math.sin(TAU*frequency*1.47*t)*Math.exp(-t*3.9)
        +.12*Math.sin(TAU*frequency*2.1*t)*Math.exp(-t*7);
      write(offset+i,body*amp*Math.min(1,t*180)*Math.min(1,(seconds-t)/.2),-.1,.8);
    }
  }

  // New C-minor elegy with inversions, a Neapolitan turn and G7(b9) cadence.
  // These notes are newly composed, not a transcription of a film theme.
  const roots=[36,34,32,31,29,37,31,36];
  const chords=[[48,51,55,60],[46,51,55,58],[44,48,51,56],[43,48,51,55],
    [41,44,48,53],[49,53,56,61],[43,47,50,56],[48,51,55,60]];
  const phrases=[
    [[0,79,.8],[1,75,1],[2.5,74,.45],[3,80,1.3],[5,79,.7],[6,72,2],[9,74,.8],[10,75,1.4]],
    [[0,77,.9],[1.5,75,.7],[3,70,1.2],[5,74,.7],[6,75,1.5],[9,79,2.2]],
    [[0,80,1.1],[2,79,.9],[3,75,1.5],[6,72,1.5],[8,70,1],[9,68,1.8]],
    [[.5,74,.8],[2,75,.8],[3,79,1.4],[6,77,.9],[7.5,75,.9],[9,74,1.6]],
    [[0,77,1.4],[3,72,1.2],[5,68,.8],[6,75,1.3],[9,72,2]],
    [[0,77,1],[1.5,73,.8],[3,80,1.1],[6,77,1.5],[9,73,2]],
    [[0,74,1],[2,71,.8],[3,68,1.7],[6,74,1.5],[9,71,1.3]],
    [[0,75,1.4],[3,74,.9],[4.5,72,1.1],[6,67,1.4],[9,72,2.6]]
  ];
  for(let field=0;field<8;field++) {
    const start=field*4*bar;
    // Opening/ending are intimate; the central sixteen bars bring the organ forward.
    const organLevel=[.034,.043,.069,.078,.078,.069,.055,.034][field];
    voice(start,4*bar+.65,roots[field],{kind:'pedal',amp:.045,attack:.24,release:.65,room:.55});
    chords[field].forEach((note,i)=>voice(start,4*bar+.62,note,{kind:'organ',amp:organLevel,pan:(i-1.5)*.2,attack:.24,release:.62,room:.8}));
    if(field>=2 && field<=6) {
      [chords[field][0]+12,chords[field][1]+12,chords[field][2]+12].forEach((note,i)=>{
        voice(start+.25,4*bar+1,note,{kind:'choir',amp:.035,pan:(i-1)*.35,attack:1.2,release:1.4,room:.9});
      });
    }
    voice(start+.2,4*bar+.8,roots[field]+12,{kind:'bow',amp:field>=2&&field<=6?.045:.027,pan:-.28,attack:.65,release:1.0,room:.75});
    for(const [at,note,beats] of phrases[field]) {
      const timing=(random()-.5)*.014;
      musicBox(start+at*beat+timing,note,field>=2&&field<=5?.095:.13,at%3===0?-.12:.12);
      if(field>=2&&field<=5) voice(start+at*beat,beats*beat+.18,note-12,{kind:'organ',amp:.067,pan:.08,attack:.065,release:.21,room:.82});
    }
    // Gentle beats two/three establish a swaying waltz, not a drum-machine groove.
    for(let localBar=0;localBar<4;localBar++) for(const offbeat of [1,2]) {
      for(let i=1;i<4;i++) voice(start+localBar*bar+offbeat*beat,.53,chords[field][i],{
        kind:'organ',amp:organLevel*.36,pan:(i-2)*.24,attack:.06,release:.27,room:.8});
    }
    if([2,4,6].includes(field)) timpani(start,roots[field],.075);
  }

  // Early stone-wall reflections plus a warm, long cathedral tail.
  const taps=[[.043,.16],[.089,.13],[.157,.10],[.231,.08],[.347,.06],[.499,.04]];
  for(let ch=0;ch<2;ch++) {
    let low=0;
    const filtered=new Float64Array(length), input=send[ch];
    for(let pass=0;pass<2;pass++) for(let i=0;i<length;i++) {low+=.16*(input[i]-low);if(pass)filtered[i]=low;}
    for(let n=0;n<taps.length;n++) {
      const [delay,gain]=taps[n], shift=Math.round((delay+ch*.009*(n%3))*rate), out=dry[n%2?1-ch:ch];
      for(let i=0;i<length;i++) out[(i+shift)%length]+=filtered[i]*gain;
    }
    // Periodically warmed feedback combs: long decay with no cut-off at the loop.
    for(const [j,delay] of [.0793,.0971,.1139,.1313].entries()) {
      const size=Math.round((delay+ch*.0031)*rate), memory=new Float64Array(size);
      const feedback=.86+j*.013, predelay=Math.round(.032*rate);
      let cursor=0, damping=0;
      for(let pass=0;pass<2;pass++) for(let i=0;i<length;i++) {
        const reflection=memory[cursor];damping+=.21*(reflection-damping);
        memory[cursor]=input[(i-predelay+length)%length]+damping*feedback;
        cursor=(cursor+1)%size;
        if(pass)dry[ch][i]+=reflection*.20;
      }
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
