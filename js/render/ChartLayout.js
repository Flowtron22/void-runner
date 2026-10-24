// A stable constellation, independent of route lanes and display aspect ratio.
export function constellationPositions(chart, seed = 1) {
  let state = (Number(seed) ^ 0x4b1d2e91) >>> 0;
  const random = () => { state = (state * 1664525 + 1013904223) >>> 0; return state / 4294967296; };
  const jitter = amount => (random() - .5) * amount;
  const positions = {[chart.start]: [-10 + jitter(1), -14 + jitter(1), 0]};
  chart.layers.forEach((layer, row) => {
    const slots = [0,1,2];
    for (let i=slots.length-1; i>0; i--) { const j=Math.floor(random()*(i+1)); [slots[i],slots[j]]=[slots[j],slots[i]]; }
    layer.forEach((node,index) => {
      if (node.type === 'boss-system') {
        positions[node.id] = [-5 + row*6.5 + jitter(2), -6 + row*18 + 3 + jitter(2), jitter(1)];
      } else {
        const slot=slots[index];
        positions[node.id] = [-5 + row*6.5 + [-4.8,.2,5.7][slot] + jitter(1.4),
          -6 + row*18 + [.7,-3.1,3.4][slot] + jitter(1.2), jitter(1.2)];
      }
    });
  });
  return positions;
}

export function constellationFraming(systems, aspect) {
  const fit = (items, paddingX, paddingY) => {
    const minX=Math.min(...items.map(item=>item.position[0])), maxX=Math.max(...items.map(item=>item.position[0]));
    const minY=Math.min(...items.map(item=>item.position[1])), maxY=Math.max(...items.map(item=>item.position[1]));
    const tan=Math.tan(42*Math.PI/360);
    return {center:[(minX+maxX)/2,(minY+maxY)/2],
      distance:Math.max(12,(maxY-minY+paddingY)/(2*tan),(maxX-minX+paddingX)/(2*tan*aspect))};
  };
  const nearby=systems.filter(system=>system.current || system.available);
  return {full:fit(systems,8,7),near:fit(nearby.length?nearby:systems.slice(0,4),4,5),
    bounds:{minX:Math.min(...systems.map(s=>s.position[0]))-5,maxX:Math.max(...systems.map(s=>s.position[0]))+5,
      minY:Math.min(...systems.map(s=>s.position[1]))-5,maxY:Math.max(...systems.map(s=>s.position[1]))+5}};
}
