import { Game } from './core/Game.js';
import { TerminalRenderer } from './render/TerminalRenderer.js';

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
});
