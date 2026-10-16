export class AudioSystem {
  constructor(){ this.ctx=null; }
  unlock(){ if(!this.ctx) this.ctx=new (window.AudioContext||window.webkitAudioContext)(); }
  tone(type='laser'){
    if(!this.ctx)return; const presets={laser:[520,.08,'sawtooth'],cannon:[120,.16,'square'],shield:[240,.12,'sine'],hit:[70,.22,'sawtooth'],door:[180,.05,'square'],win:[660,.35,'sine'],lose:[90,.5,'sawtooth']};const [freq,duration,wave]=presets[type]||presets.laser;
    const o=this.ctx.createOscillator(),g=this.ctx.createGain();o.type=wave;o.frequency.setValueAtTime(freq,this.ctx.currentTime);o.frequency.exponentialRampToValueAtTime(Math.max(40,freq*.55),this.ctx.currentTime+duration);g.gain.setValueAtTime(.055,this.ctx.currentTime);g.gain.exponentialRampToValueAtTime(.0001,this.ctx.currentTime+duration);o.connect(g).connect(this.ctx.destination);o.start();o.stop(this.ctx.currentTime+duration);
  }
}
