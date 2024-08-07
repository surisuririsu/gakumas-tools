export default class StageConfig {
  constructor(turns, firstTurns, criteria) {
    this.turnCount = turns.vocal + turns.dance + turns.visual;
    this.turnTypes = this.generateTurnTypes(turns, firstTurns, criteria);
    this.criteria = criteria;
  }

  generateTurnTypes(turns, firstTurns, criteria) {
    const remainingTurns = { ...turns };

    const firstTurn = firstTurns[Math.floor(Math.random() * firstTurns.length)];
    remainingTurns[firstTurn] -= 1;

    const sortedTypes = Object.keys(criteria).sort(
      (a, b) => criteria[b] - criteria[a]
    );
    const lastThreeTurns = sortedTypes.slice().reverse();
    lastThreeTurns.forEach((t) => (remainingTurns[t] -= 1));

    let turnPool = Object.keys(remainingTurns).reduce(
      (acc, cur) => acc.concat(new Array(remainingTurns[cur]).fill(cur)),
      []
    );
    let randomTurns = [];
    while (turnPool.length) {
      const index = Math.floor(Math.random() * turnPool.length);
      randomTurns.push(turnPool.splice(index, 1)[0]);
    }

    return [firstTurn, ...randomTurns, ...lastThreeTurns];
  }
}
