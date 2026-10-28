export const SFX_NAMES=Object.freeze([
  'hover','click','confirm','back','toggle','double','screen','zoomIn','zoomOut','zoomAll',
  'transmission','battleStart','attackPlayer','attackEnemy','dice','impact','impactHeavy',
  'place','equip','purchase','reward','victory','defeat','warning'
]);

const INTERACTIVE='button, input, [role="button"], [data-chart-system], .unit-card, .roster-card';
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));

export class AudioSystem {
  constructor({muted=false,contextFactory=null,onError=()=>{}}={}) {
    this.muted=muted;this.contextFactory=contextFactory;this.onError=onError;
    this.ctx=null;this.master=null;this.noiseBuffer=null;this.controller=null;
    this.lastHover=null;this.lastHoverAt=0;
  }

  unlock() {
    if(this.muted)return null;
    try {
      if(!this.ctx) {
        const Factory=this.contextFactory || window.AudioContext || window.webkitAudioContext;
        if(!Factory)return null;
        this.ctx=typeof Factory==='function' ? new Factory() : Factory;
        this.master=this.ctx.createGain();this.master.gain.value=.52;this.master.connect(this.ctx.destination);
      }
      if(this.ctx.state==='suspended')this.ctx.resume().catch(this.onError);
      return this.ctx;
    } catch(error) {this.onError(error);return null;}
  }

  setMuted(muted) {
    this.muted=Boolean(muted);
    if(this.master)this.master.gain.setTargetAtTime(this.muted?0:.52,this.ctx.currentTime,.015);
  }

  oscillator({frequency=220,to=frequency,duration=.08,type='sine',gain=.04,at=0,detune=0}={}) {
    const ctx=this.ctx,now=ctx.currentTime+at,oscillator=ctx.createOscillator(),volume=ctx.createGain();
    oscillator.type=type;oscillator.detune.value=detune;
    oscillator.frequency.setValueAtTime(Math.max(24,frequency),now);
    if(to!==frequency)oscillator.frequency.exponentialRampToValueAtTime(Math.max(24,to),now+duration);
    volume.gain.setValueAtTime(.0001,now);
    volume.gain.exponentialRampToValueAtTime(Math.max(.0002,gain),now+Math.min(.012,duration*.2));
    volume.gain.exponentialRampToValueAtTime(.0001,now+duration);
    oscillator.connect(volume).connect(this.master);oscillator.start(now);oscillator.stop(now+duration+.02);
  }

  noise({duration=.05,gain=.035,at=0,lowpass=1800,highpass=80}={}) {
    const ctx=this.ctx,now=ctx.currentTime+at;
    if(!this.noiseBuffer) {
      const length=Math.ceil(ctx.sampleRate*.4),buffer=ctx.createBuffer(1,length,ctx.sampleRate),data=buffer.getChannelData(0);
      let state=0x53465831;
      for(let i=0;i<length;i++) {state=(Math.imul(state,1664525)+1013904223)>>>0;data[i]=state/2147483648-1;}
      this.noiseBuffer=buffer;
    }
    const source=ctx.createBufferSource(),hp=ctx.createBiquadFilter(),lp=ctx.createBiquadFilter(),volume=ctx.createGain();
    source.buffer=this.noiseBuffer;hp.type='highpass';hp.frequency.value=highpass;lp.type='lowpass';lp.frequency.value=lowpass;
    volume.gain.setValueAtTime(Math.max(.0002,gain),now);volume.gain.exponentialRampToValueAtTime(.0001,now+duration);
    source.connect(hp).connect(lp).connect(volume).connect(this.master);source.start(now);source.stop(now+duration+.02);
  }

  play(name='click',{intensity=1}={}) {
    if(this.muted || !SFX_NAMES.includes(name) || !this.unlock())return false;
    const level=clamp(intensity,.35,1.4);
    try {
      switch(name) {
        case 'hover': this.oscillator({frequency:880,to:690,duration:.025,type:'sine',gain:.009*level});break;
        case 'click':
          this.noise({duration:.035,gain:.038*level,lowpass:1450});this.oscillator({frequency:155,to:92,duration:.055,type:'triangle',gain:.028*level});break;
        case 'confirm':
          this.noise({duration:.04,gain:.033*level,lowpass:1800});this.oscillator({frequency:330,to:405,duration:.09,type:'triangle',gain:.027*level});
          this.oscillator({frequency:495,to:610,duration:.11,type:'sine',gain:.018*level,at:.035});break;
        case 'back':
          this.noise({duration:.045,gain:.026*level,lowpass:1150});this.oscillator({frequency:260,to:145,duration:.10,type:'triangle',gain:.025*level});break;
        case 'toggle':
          this.noise({duration:.025,gain:.025*level,lowpass:2200});this.oscillator({frequency:520,to:610,duration:.055,type:'square',gain:.012*level});break;
        case 'double':
          this.play('click',{intensity:.8*level});this.noise({duration:.032,gain:.035*level,at:.075,lowpass:1550});
          this.oscillator({frequency:175,to:105,duration:.05,type:'triangle',gain:.026*level,at:.075});break;
        case 'screen':
          this.noise({duration:.13,gain:.025*level,lowpass:900});this.oscillator({frequency:74,to:58,duration:.18,type:'sine',gain:.031*level});
          this.oscillator({frequency:720,to:920,duration:.06,type:'triangle',gain:.012*level,at:.11});break;
        case 'zoomIn':case 'zoomOut':case 'zoomAll': {
          const inward=name==='zoomIn',all=name==='zoomAll';this.noise({duration:.05,gain:.023*level,lowpass:2400});
          this.oscillator({frequency:all?310:inward?210:430,to:all?620:inward?520:180,duration:all?.18:.12,type:'sine',gain:.023*level});break;
        }
        case 'transmission':
          for(const [at,freq] of [[0,740],[.075,555],[.15,830]])this.oscillator({frequency:freq,to:freq*.96,duration:.065,type:'triangle',gain:.017*level,at});break;
        case 'battleStart':
          this.noise({duration:.28,gain:.055*level,lowpass:520});this.oscillator({frequency:76,to:48,duration:.42,type:'sawtooth',gain:.045*level});
          this.oscillator({frequency:294,to:220,duration:.24,type:'triangle',gain:.023*level,at:.16});break;
        case 'attackPlayer':case 'attackEnemy': {
          const enemy=name==='attackEnemy';this.noise({duration:.055,gain:.035*level,lowpass:enemy?1250:1900});
          this.oscillator({frequency:enemy?310:610,to:enemy?105:235,duration:.14,type:'sawtooth',gain:.027*level});break;
        }
        case 'dice': for(const at of [0,.018,.041])this.noise({duration:.025,gain:.022*level,at,lowpass:2600,highpass:280});break;
        case 'impact':case 'impactHeavy': {
          const heavy=name==='impactHeavy';this.noise({duration:heavy?.22:.12,gain:(heavy?.09:.055)*level,lowpass:heavy?650:1050});
          this.oscillator({frequency:heavy?82:135,to:heavy?36:62,duration:heavy?.32:.18,type:'sawtooth',gain:(heavy?.052:.036)*level});break;
        }
        case 'place':case 'equip':
          this.noise({duration:.045,gain:.035*level,lowpass:1350});this.oscillator({frequency:name==='equip'?420:230,to:name==='equip'?560:170,duration:.10,type:'triangle',gain:.025*level});break;
        case 'purchase':
          for(const [at,freq] of [[0,520],[.045,660],[.09,790]])this.oscillator({frequency:freq,to:freq*.92,duration:.07,type:'triangle',gain:.018*level,at});
          this.noise({duration:.04,gain:.022*level,at:.09,lowpass:1800});break;
        case 'reward':
          for(const [at,freq] of [[0,294],[.12,440],[.24,587]])this.oscillator({frequency:freq,to:freq*1.025,duration:.28,type:'sine',gain:.025*level,at});break;
        case 'victory':
          for(const [at,freq,dur] of [[0,146.83,.72],[.12,220,.66],[.26,293.66,.72],[.52,440,1.05]])this.oscillator({frequency:freq,to:freq*1.008,duration:dur,type:'sine',gain:.032*level,at});
          this.noise({duration:.32,gain:.018*level,at:.45,lowpass:1200});break;
        case 'defeat':
          for(const [at,freq] of [[0,146.83],[.18,123.47],[.38,92.5],[.62,73.42]])this.oscillator({frequency:freq,to:freq*.72,duration:.72,type:'sawtooth',gain:.026*level,at});
          this.noise({duration:.7,gain:.025*level,lowpass:420});break;
        case 'warning':
          this.oscillator({frequency:185,to:172,duration:.18,type:'square',gain:.021*level});this.oscillator({frequency:185,to:172,duration:.18,type:'square',gain:.021*level,at:.24});break;
      }
      return true;
    } catch(error) {this.onError(error);return false;}
  }

  soundFor(element) {
    const explicit=element?.dataset?.sfx;if(explicit && SFX_NAMES.includes(explicit))return explicit;
    const zoom=element?.dataset?.chartZoom;if(zoom)return zoom==='in'?'zoomIn':zoom==='out'?'zoomOut':'zoomAll';
    if(element?.matches('input[type="checkbox"], input[type="radio"]'))return 'toggle';
    const label=(element?.textContent || element?.getAttribute?.('aria-label') || '').trim();
    if(/return|back|belay|cancel|leave|close/i.test(label))return 'back';
    if(/delete|remove|abandon|end run/i.test(label))return 'warning';
    if(element?.classList?.contains('primary') || /start|accept|continue|deploy|claim|purchase|buy|confirm|assume/i.test(label))return 'confirm';
    return 'click';
  }

  bind(doc=document) {
    this.controller?.abort();this.controller=new AbortController();
    const signal=this.controller.signal,interactive=event=>event.target instanceof Element?event.target.closest(INTERACTIVE):null;
    doc.addEventListener('pointerdown',event=>{const element=interactive(event);if(element && !element.matches(':disabled,[aria-disabled="true"]'))this.play(this.soundFor(element));},{capture:true,signal});
    doc.addEventListener('pointerover',event=>{const element=interactive(event),now=performance.now();
      if(!this.ctx || !element || element===this.lastHover || now-this.lastHoverAt<70 || element.matches(':disabled,[aria-disabled="true"]'))return;
      this.lastHover=element;this.lastHoverAt=now;this.play('hover');},{capture:true,signal});
    doc.addEventListener('pointerout',event=>{if(interactive(event)===this.lastHover)this.lastHover=null;},{capture:true,signal});
    doc.addEventListener('dblclick',event=>{if(interactive(event))this.play('double');},{capture:true,signal});
    doc.addEventListener('keydown',event=>{if(event.repeat || !['Enter',' '].includes(event.key))return;
      const element=interactive(event);if(element && !element.matches(':disabled,[aria-disabled="true"]'))this.play(this.soundFor(element));},{capture:true,signal});
    doc.addEventListener('combat-patrol:sfx',event=>this.play(event.detail?.name,event.detail || {}),{signal});
    doc.addEventListener('visibilitychange',()=>{if(doc.hidden)this.ctx?.suspend?.();},{signal});
  }

  dispose() {
    this.controller?.abort();this.controller=null;const ctx=this.ctx;this.ctx=null;this.master=null;this.noiseBuffer=null;
    if(ctx && ctx.state!=='closed')ctx.close().catch(this.onError);
  }
}
