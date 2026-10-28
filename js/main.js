import { Game } from './core/Game.js';
import { TerminalRenderer } from './render/TerminalRenderer.js';
import { MusicSystem } from './core/MusicSystem.js';

window.addEventListener('DOMContentLoaded', async () => {
  let terminal = null;
  try {
    terminal = new TerminalRenderer(document.querySelector('#app'));
  } catch (error) {
    console.error('Unable to initialize the command terminal', error);
  }
  const response = await fetch('./data/warhammer-roster.json');
  if (!response.ok) throw new Error('Unable to load the KS roster data.');
  const roster = await response.json();
  window.voidRunner = new Game(roster);
  window.voidRunnerTerminal = terminal;
  const game=window.voidRunner;
  const music=new MusicSystem({muted:Boolean(game.meta.settings.musicMuted),onError:error=>console.warn('Background music unavailable:',error.message)});
  const musicToggle=document.querySelector('#music-toggle');
  musicToggle.checked=!music.muted;
  musicToggle.addEventListener('change',()=>{
    game.meta.settings.musicMuted=!musicToggle.checked;
    music.setMuted(game.meta.settings.musicMuted);
    game.save();
  });
  music.bind();
  window.voidRunnerMusic=music;
  window.addEventListener('pagehide',event=>{if(!event.persisted)music.dispose();});
});
