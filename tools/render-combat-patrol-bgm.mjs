// Processional of the Iron Saint — original military-ecclesiastical score for COMBAT PATROL.
// Martial cadence and cathedral registration define the mood; all musical material is new.
// npm run audio:render; optional --wav-only, --wav <path>, --out <path>.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { createRequire } from 'node:module';
import { spawnSync } from 'node:child_process';

export const SCORE = Object.freeze({ title:'Processional of the Iron Saint', bpm:75, beatsPerBar:4, bars:20, rate:44100, seed:0x4f524741, duration:64 });
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
  function sanctuaryBell(start, note, amp=.045, pan=0) {
    const offset=Math.round(start*rate), frequency=midi(note), seconds=7.5;
    for(let i=0;i<seconds*rate;i++) {
      const t=i/rate, attack=1-Math.exp(-t*90);
      const value=Math.sin(TAU*frequency*t)*Math.exp(-t*.58)*.54
        +Math.sin(TAU*frequency*2.012*t)*Math.exp(-t*.87)*.18
        +Math.sin(TAU*frequency*2.706*t)*Math.exp(-t*1.08)*.13
        +Math.sin(TAU*frequency*4.193*t)*Math.exp(-t*1.6)*.08
        +Math.sin(TAU*frequency*5.431*t)*Math.exp(-t*2.1)*.04;
      write(offset+i,value*amp*attack*Math.min(1,(seconds-t)/.35),pan,.94);
    }
  }
  function roomAir(amp=.001) {
    // Integer-cycle partials create a noise-like chapel hush that is exactly periodic.
    const air=Array.from({length:10},()=>({cycles:1800+Math.floor(random()*42000),phase:random()*TAU}));
    for(let i=0;i<length;i++) {
      let shaped=0;
      for(const partial of air) shaped+=Math.sin(TAU*partial.cycles*i/length+partial.phase);
      const breathe=.72+.28*Math.sin(TAU*4*i/length);
      write(i,shaped/air.length*amp*breathe,0,.98);
    }
  }
  function warDrum(start,note=38,amp=.08,pan=0) {
    const offset=Math.round(start*rate),seconds=1.45,frequency=midi(note);
    for(let i=0;i<seconds*rate;i++) {
      const t=i/rate,phase=TAU*frequency*(t+.24*t*t);
      const body=(Math.sin(phase)+.28*Math.sin(phase*1.51)+.12*Math.sin(phase*2.07))*Math.exp(-t*3.15);
      const strike=Math.sin(TAU*frequency*5.7*t)*Math.exp(-t*28);
      write(offset+i,(body+strike*.22)*amp*Math.min(1,t*190),pan,.7);
    }
  }
  function fieldSnare(start,amp=.025,pan=.12) {
    const offset=Math.round(start*rate),seconds=.26;
    let noiseState=(seed^offset)>>>0,previous=0;
    for(let i=0;i<seconds*rate;i++) {
      noiseState=(Math.imul(noiseState,1664525)+1013904223)>>>0;
      const white=noiseState/2147483648-1,bright=white-previous*.72;previous=white;
      const t=i/rate,envelope=Math.exp(-t*19)*Math.min(1,t*260);
      const wires=Math.sin(TAU*196*t)*Math.exp(-t*12);
      write(offset+i,(bright*.76+wires*.24)*amp*envelope,pan,.48);
    }
  }

  // Original D-minor processional with a martial dominant and broad cathedral voicings.
  const roots=[38,34,36,38,41,31,34,36,33,38];
  const chords=[[50,53,57],[46,50,53],[48,52,55],[50,53,57],[53,57,60],
    [43,46,50],[46,50,53],[48,52,55],[45,49,52],[50,53,57]];
  const phrases=[
    [[.35,62,1.35],[2.25,65,1.25],[4.35,69,1.65]],
    [[.25,65,1.45],[2.25,62,1.25],[4.25,58,1.75]],
    [[.3,60,1.3],[2.2,64,1.35],[4.3,67,1.65]],
    [[.2,69,1.5],[2.35,67,1.15],[4.2,65,1.8]],
    [[.3,65,1.25],[2.2,69,1.5],[4.45,72,1.45]],
    [[.25,70,1.4],[2.25,67,1.2],[4.2,65,1.75]],
    [[.3,65,1.3],[2.25,62,1.25],[4.25,58,1.7]],
    [[.25,64,1.3],[2.2,67,1.3],[4.3,72,1.6]],
    [[.3,69,1.35],[2.25,73,1.2],[4.2,72,1.75]],
    [[.2,69,1.35],[2.15,65,1.3],[4.2,62,1.9]]
  ];
  roomAir();
  for(let field=0;field<10;field++) {
    const start=field*2*bar, span=2*bar+.9;
    const intensity=[.58,.64,.72,.8,.9,.98,1,.98,.9,.7][field];
    voice(start,span,roots[field],{kind:'pedal',amp:.047*intensity,attack:.18,release:.9,room:.82});
    voice(start+.06,span,roots[field]+12,{kind:'organ',amp:.052*intensity,pan:-.22,attack:.22,release:.85,room:.86});
    chords[field].forEach((note,i)=>voice(start+.08,span,note,{kind:'organ',amp:.042*intensity,
      pan:(i-1)*.28,attack:.16,release:.82,room:.9}));
    chords[field].forEach((note,i)=>voice(start+.24,span-.2,note-12,{kind:'choir',amp:.026*intensity,
      pan:(i-1)*.4,attack:1.1,release:1.35,room:1}));
    if(field>=3 && field<=8) chords[field].slice(0,2).forEach((note,i)=>voice(start+.35,span-.4,note+12,
      {kind:'choir',amp:.019*intensity,pan:i?.46:-.46,attack:1.4,release:1.5,room:1}));
    for(const [at,note,seconds] of phrases[field]) {
      const timing=(random()-.5)*.025;
      voice(start+at+timing,seconds,note,{kind:'organ',amp:.075*intensity,pan:.05,
        attack:.055,release:.28,room:.92});
      if(field>=2)voice(start+at+.06,seconds+.3,note-12,{kind:'choir',amp:.025*intensity,pan:-.08,
        attack:.42,release:.62,room:1});
    }
    for(let localBar=0;localBar<2;localBar++) {
      const barStart=start+localBar*bar;
      warDrum(barStart,roots[field],.082*intensity,-.08);
      warDrum(barStart+2*beat,roots[field],.056*intensity,.08);
      fieldSnare(barStart+beat,.02*intensity,.18);
      fieldSnare(barStart+3*beat,.028*intensity,-.14);
      for(const pulse of [0,2])chords[field].forEach((note,i)=>voice(barStart+pulse*beat,.58*beat,note,
        {kind:'organ',amp:.055*intensity,pan:(i-1)*.25,attack:.025,release:.16,room:.78}));
    }
    if([0,4,7,9].includes(field)) sanctuaryBell(start+.08,chords[field][0]+12,.025*intensity,field%2?.32:-.32);
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
  // Remove the minute endpoint offset left by recursive filters without fading the loop edges.
  peak=0;
  for(const channel of result) {
    const closure=channel[0]-channel[length-1];
    for(let i=0;i<length;i++) {
      channel[i]+=closure*i/(length-1);
      peak=Math.max(peak,Math.abs(channel[i]));
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
