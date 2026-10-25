// Source pixels remain unchanged. Each SVG window frames the face through torso.
// x/y/width/height are authored crop bounds in the original image's coordinates.
const art = {
  brother: ['battle-brother.webp',531,836,[135,160,360,420]],
  terminator: ['terminator.webp',837,967,[200,185,430,500]],
  dreadknight: ['dreadknight.webp',673,939,[150,240,380,440]],
  librarian: ['librarian.webp',786,1049,[280,300,420,480]],
  paladin: ['paladin.webp',523,746,[165,65,310,360]],
  purgation: ['purgation.webp',454,791,[80,0,360,420]],
  purifier: ['purifier.webp',450,686,[70,0,340,395]],
  crowe: ['crowe.webp',778,1131,[130,270,500,580]],
  voldus: ['grand-master-voldus.webp',1000,792,[570,230,320,370]],
  champion: ['champion.webp',516,753,[130,145,300,350]],
  chaplain: ['chaplain.webp',667,1000,[180,280,380,440]],
  techmarine: ['techmarine.webp',625,910,[125,190,350,405]],
  captain: ['brother-captain.webp',803,1200,[200,235,450,520]],
  venerable: ['venerable-dreadnought.webp',842,1247,[220,240,440,510]],
  draigo: ['kaldor-draigo.webp',680,957,[80,90,400,465]]
};
const units = {
  'grey-knight-strike-squad':'brother',
  'grey-knight-terminators':'terminator',
  'nemesis-dreadknight':'dreadknight',
  'brotherhood-librarian':'librarian',
  'grey-knight-interceptors':'brother',
  'grey-knight-paladins':'paladin',
  'grey-knight-purgation':'purgation',
  'grey-knight-purifiers':'purifier',
  'grey-knight-castellan-crowe':'crowe',
  'grey-knight-voldus':'voldus',
  'grey-knight-champion':'champion',
  'grey-knight-chaplain':'chaplain',
  'grey-knight-techmarine':'techmarine',
  'grey-knight-brother-captain':'captain',
  'grey-knight-venerable-dreadnought':'venerable',
  'grey-knight-kaldor-draigo':'draigo'
};

export function portraitMarkup(id, wide=false) {
  const entry=art[units[id.split('--rescued-')[0]]];
  if(!entry) return '';
  const [file,width,height,crop]=entry;
  // Meet on the wide datasheet preserves the entire face-to-torso window.
  // The tall archive cards have the same aspect ratio as the authored crop.
  return `<svg class="unit-portrait-window" viewBox="${crop.join(' ')}" preserveAspectRatio="xMidYMid ${wide?'meet':'slice'}" aria-hidden="true" focusable="false"><image href="/assets/unit-portraits/${file}" width="${width}" height="${height}"/></svg>`;
}
