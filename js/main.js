import { Game } from './core/Game.js';

window.addEventListener('DOMContentLoaded', async () => {
  const response = await fetch('./data/warhammer-roster.json');
  if (!response.ok) throw new Error('Unable to load the KS roster data.');
  const roster = await response.json();
  window.voidRunner = new Game(roster);
});
