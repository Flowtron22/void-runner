// Count actual surviving models and applied damage, never uncommitted dice previews.
export function summarizeBattle(battle, victory) {
  const total=force=>force.reduce((sum,unit)=>sum+unit.models,0);
  const alive=force=>force.reduce((sum,unit)=>sum+unit.hp.length,0);
  const playerModels=total(battle.players), enemyModels=total(battle.enemies);
  return {
    nodeId:battle.node.id,nodeName:battle.node.name,victory,rounds:battle.round,
    playerModels,enemyModels,playerModelsLost:playerModels-alive(battle.players),
    enemyModelsLost:enemyModels-alive(battle.enemies),survivors:alive(battle.players),
    damageDealt:battle.stats?.damageDealt ?? 0,damageTaken:battle.stats?.damageTaken ?? 0
  };
}

export function battleReportRows(report) {
  const ratio=(lost,total)=>`${lost} / ${total}`;
  return [
    ['ROUNDS',report?.rounds ?? '—'],
    ['ENEMY LOSSES',report?ratio(report.enemyModelsLost,report.enemyModels):'—'],
    ['OUR LOSSES',report?ratio(report.playerModelsLost,report.playerModels):'—'],
    ['WOUNDS DEALT',report?.damageDealt ?? '—'],
    ['WOUNDS TAKEN',report?.damageTaken ?? '—'],
    ['SURVIVORS',report?.survivors ?? '—']
  ];
}

export function addCombatTotals(totals={},report) {
  const next={...totals};
  for(const key of ['rounds','enemyModelsLost','playerModelsLost','damageDealt','damageTaken']) next[key]=(next[key] || 0)+report[key];
  return next;
}
