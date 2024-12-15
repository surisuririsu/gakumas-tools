export default class StageConfig {
  constructor(stage) {
    const {
      type,
      plan,
      season,
      defaultCardSet,
      turnCounts,
      firstTurns,
      criteria,
      effects,
    } = stage;
    this.type = type;
    this.plan = plan;
    this.defaultCardSet = defaultCardSet;
    this.season = season;
    this.turnCounts = turnCounts;
    this.firstTurns = firstTurns;
    this.criteria = criteria;
    this.effects = effects;
    this.turnCount = turnCounts.vocal + turnCounts.dance + turnCounts.visual;
  }
}
