// One legality check for touch preview, tap placement and final drop.
export function placementIssue({unit, unlocked, deployed, cap, used, x, y, rotated, unitFor}) {
  if (!unit || !unlocked) return 'PATTERN UNRECOVERED · FIND IN SECTOR';
  if (deployed.filter(p=>p.unitId===unit.id).length >= unit.stock) return 'ALL COPIES DEPLOYED';
  if (used + unit.points > cap) return `NEED ${used + unit.points - cap} MORE POINTS`;
  const [w,h] = rotated ? [...unit.size].reverse() : unit.size;
  if (!Number.isInteger(x) || !Number.isInteger(y) || x<0 || y<0 || x+w>6 || y+h>5) return 'THAT UNIT DOES NOT FIT HERE';
  if (deployed.some(p=>{
    const other=unitFor(p.unitId);
    const [pw,ph]=p.rotated?[...other.size].reverse():other.size;
    return x<p.x+pw && x+w>p.x && y<p.y+ph && y+h>p.y;
  })) return 'THAT SPACE IS OCCUPIED';
  return null;
}
