export default class StageConfig {
  constructor(stage) {
    const { turnCounts, firstTurns, criteria, effects } = stage;
    this.turnCounts = turnCounts;
    this.firstTurns = firstTurns;
    this.criteria = criteria;
    this.effects = effects;
    this.turnCount = turnCounts.vocal + turnCounts.dance + turnCounts.visual;
  }
}
