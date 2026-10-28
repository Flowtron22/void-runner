// A single loop for the whole game. No screen transitions restart the score.
export const MUSIC_URL = `${new URL('../../assets/audio/combat-patrol-bgm.m4a',import.meta.url).href}?v=20261028-3`;
export const MUSIC_LOOP_SECONDS = 64;

export class MusicSystem {
  constructor({muted=false,volume=.45,contextFactory=()=>new (window.AudioContext || window.webkitAudioContext)(),fetcher=url=>fetch(url),onError=()=>{}}={}) {
    this.muted=muted;this.volume=volume;this.contextFactory=contextFactory;this.fetcher=fetcher;this.onError=onError;
    this.context=null;this.buffer=null;this.source=null;this.loading=null;this.hidden=false;this.unlocked=false;this.disposed=false;
  }
  async activate() {
    if(this.muted || this.hidden || this.disposed) return;
    this.unlocked=true;
    try {
      // Resume immediately inside the user's gesture, before any network await.
      const ctx=this.context ||= this.contextFactory();
      const resumed=ctx.resume();
      if(!this.gain) {this.gain=ctx.createGain();this.gain.gain.value=this.volume;this.gain.connect(ctx.destination);}
      this.loading ||= this.fetcher(MUSIC_URL).then(response=>{
        if(!response.ok) throw new Error(`Music request failed (${response.status}).`);
        return response.arrayBuffer();
      }).then(bytes=>ctx.decodeAudioData(bytes)).then(buffer=>{this.buffer=buffer;return buffer;}).catch(error=>{this.loading=null;throw error;});
      const [buffer]=await Promise.all([this.loading,resumed]);
      if(this.muted || this.hidden || this.disposed) return;
      if(!this.source) {
        this.source=ctx.createBufferSource();this.source.buffer=buffer;this.source.loop=true;
        this.source.loopStart=0;this.source.loopEnd=Math.min(MUSIC_LOOP_SECONDS,buffer.duration);
        this.source.connect(this.gain);this.source.start();
      }
    } catch(error) {if(!this.disposed)this.onError(error);}
  }
  setMuted(muted) {
    this.muted=Boolean(muted);
    if(this.gain)this.gain.gain.value=this.muted?0:this.volume;
    if(this.muted)this.context?.suspend()?.catch(()=>{});
    else this.activate();
  }
  setHidden(hidden) {
    this.hidden=Boolean(hidden);
    if(this.hidden)this.context?.suspend()?.catch(()=>{});
    else if(this.unlocked)this.activate();
  }
  bind(doc=document) {
    this.hidden=doc.hidden;
    this.controller=new AbortController();
    const options={signal:this.controller.signal,passive:true};
    doc.addEventListener('pointerdown',()=>this.activate(),options);
    doc.addEventListener('keydown',event=>{if(!event.repeat && !event.ctrlKey && !event.metaKey && !event.altKey)this.activate();},options);
    doc.addEventListener('visibilitychange',()=>this.setHidden(doc.hidden),{signal:this.controller.signal});
  }
  dispose() {
    this.disposed=true;this.controller?.abort();this.source?.stop();this.source?.disconnect();
    this.gain?.disconnect();this.context?.close()?.catch(()=>{});
  }
}
