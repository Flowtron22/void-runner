// Saved route topology extends the existing three-choice battle layers.
export function buildSectorChart({region, depth, makeLayer, offers, history, step, previousLayers = []}) {
  const visited = history.filter(node => node.region === region);
  const layers = Array.from({length: depth + 1}, (_, row) => {
    if (row === depth) {
      const bosses = makeLayer(row);
      return [{id:`r${region}-boss-system`,type:'boss-system',name:'SECTOR COMMAND',lane:1,step:row,region,
        enemyFaction:bosses[0].enemyFaction,bossOptions:bosses.map(boss => ({...boss,enemyFaction:bosses[0].enemyFaction}))}];
    }
    const existing = row === step && offers?.some(node => node.type !== 'boss') ? offers : previousLayers[row];
    const nodes = existing?.length ? structuredClone(existing) : makeLayer(row);
    for (const previous of visited.filter(node => node.step === row)) {
      const index = nodes.findIndex(node => node.id === previous.id);
      if (index >= 0) nodes[index] = structuredClone(previous);
    }
    return nodes.map((node, lane) => ({...node, lane, step: row, region}));
  });
  const start = `r${region}-start`;
  const links = layers[0].map(node => ({from: start, to: node.id}));
  for (let row = 1; row < layers.length; row++) {
    for (const from of layers[row - 1]) for (const to of layers[row]) {
      if (row === depth || Math.abs(from.lane - to.lane) <= 1) links.push({from: from.id, to: to.id});
    }
  }
  return {version: 2, depth, start, layers, links, legacyOpenStep: offers?.length ? step : null};
}

export function chartState(chart, history, region, step, sectorStars) {
  const visited = history.filter(node => node.region === region);
  const cleared = new Set(visited.map(node => node.id));
  const previous = visited.find(node => node.step === step - 1);
  const currentId = previous?.id || chart.start;
  const reachable = new Set(chart.links.filter(link => link.from === currentId).map(link => link.to));
  const nodes = chart.layers.flatMap((layer, row) => layer.map(node => {
    const needsStars = node.type === 'boss' && sectorStars < node.threshold;
    const adjacent = reachable.has(node.id) || chart.legacyOpenStep === step;
    const available = row === step && adjacent && !needsStars;
    return {...node, locked: !available, needsStars,
      status: cleared.has(node.id) ? 'complete' : available ? 'available' : row < step ? 'bypassed' : 'locked'};
  }));
  return {nodes, currentId, cleared};
}
