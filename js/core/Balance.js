// Versioned per mission: saved missions retain their original encounter/reward rules.
export const BALANCE_VERSION=1;
export const balanced=run=>run?.balanceVersion===BALANCE_VERSION;
export const capacityCost=rank=>Math.min(180,60+15*rank);
export function prepareTraining(profile) {
  if(profile.balanceTrainingVersion===1)return;
  // Retire the old army-wide hit/wound/FNP stack without deleting purchased progress.
  const legacy=Math.min(3,profile.research.doctrine || 0);
  for(const type of ['infantry','vehicle'])profile.research[type+'-attacks']=Math.max(profile.research[type+'-attacks'] || 0,legacy);
  profile.balanceTrainingVersion=1;
}
export function encounterDifficulty(node,region=0) {
  const sector=Math.max(0,Math.min(3,region ?? 0));
  const escalation=[1,1.18,1.4,1.65][sector];
  const base=node.type==='boss'?[1.15,1.42,1.8][(node.bossTier || 1)-1]:.62+.14*(node.stars || 1)+.035*(node.step || 0);
  return base*escalation;
}
export function threatCapacity(cap) {return 500+Math.max(0,cap-500)*.85;}
export function fortificationBonus(rank,hpFraction) {
  return rank>0 && hpFraction>[.75,.5,-1][Math.min(3,rank)-1]?1:0;
}
export function bossReward(tier=1) {return 30+5*(Math.max(1,Math.min(3,tier))-1);}
export function earlyRecovery(run) {
  if((run.securedSectors?.length || 0)>0 || (run.chests || 0)>0)return 0;
  return Math.min(9,new Set(run.balanceVictories || []).size*3);
}
export function pacedClaims(node) {
  const step=node.step ?? Number(node.id?.match(/s(\d+)n/)?.[1] || 0);
  const boss=node.type==='boss';
  // Six passive and six tactic rewards over a full route, instead of sixteen each.
  return {currency:1,honour:Number(step===0 && !boss || boss && (node.region || 0)%2===0),
    stratagem:Number(step===1 && !boss || boss && (node.region || 0)%2===1),
    gear:Number(boss || step===2 || (node.stars || 1)>=2),recovery:Number(boss)};
}
