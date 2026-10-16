export function shortestPath(rooms, fromId, toId, canTraverse = () => true) {
  if (fromId === toId) return [fromId];
  const queue = [[fromId]], visited = new Set([fromId]);
  while (queue.length) {
    const path = queue.shift();
    const room = rooms.get(path.at(-1));
    for (const next of room.neighbors) {
      if (visited.has(next) || !canTraverse(room.id, next)) continue;
      const nextPath = [...path, next];
      if (next === toId) return nextPath;
      visited.add(next); queue.push(nextPath);
    }
  }
  return null;
}
