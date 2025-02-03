import { SkillCards } from "gakumas-data/lite";
import { S } from "../constants";
import EngineComponent from "./EngineComponent";
import { getRand, shuffle } from "./utils";

export default class TurnManager extends EngineComponent {
  constructor(engine) {
    super(engine);

    this.variableResolvers = {
      isVocalTurn: (state) => this.getTurnType(state) == "vocal",
      isDanceTurn: (state) => this.getTurnType(state) == "dance",
      isVisualTurn: (state) => this.getTurnType(state) == "visual",
    };
  }

  initializeState(state) {
    state[S.turnsElapsed] = 0;
    state[S.turnsRemaining] = this.config.stage.turnCount;
    state[S.turnTypes] = this.generateTurnTypes();
  }

  getTurnType(state) {
    return state[S.turnTypes][
      Math.min(state[S.turnsElapsed], this.config.stage.turnCount - 1)
    ];
  }

  getTurnMultiplier(state) {
    const turnType = this.getTurnType(state);
    return this.config.typeMultipliers[turnType];
  }

  generateTurnTypes() {
    const { turnCounts, firstTurns, criteria } = this.config.stage;

    // Initialize remaining counts for each turn type
    const remainingTurns = { ...turnCounts };

    // Pick first turn based on configured distribution
    const rand = getRand();
    let firstTurn = "vocal";
    if (rand > firstTurns.vocal) firstTurn = "dance";
    if (rand > firstTurns.vocal + firstTurns.dance) firstTurn = "visual";
    remainingTurns[firstTurn]--;

    // Pick last 3 turns based on stage criteria
    const sortedTypes = Object.keys(criteria).sort(
      (a, b) => criteria[b] - criteria[a]
    );
    const lastThreeTurns = sortedTypes.slice().reverse();
    lastThreeTurns.forEach((t) => remainingTurns[t]--);

    let randomTurns = [];
    for (let k in remainingTurns) {
      for (let i = 0; i < remainingTurns[k]; i++) {
        randomTurns.push(k);
      }
    }
    shuffle(randomTurns);

    return [firstTurn, ...randomTurns, ...lastThreeTurns];
  }

  startTurn(state) {
    this.logger.debug("Starting turn", state[S.turnsElapsed] + 1);

    this.logger.log(state, "startTurn", {
      num: state[S.turnsElapsed] + 1,
      type: this.getTurnType(state),
      multiplier: this.getTurnMultiplier(state),
    });

    // Draw cards
    for (let i = 0; i < 3; i++) {
      this.engine.cardManager.drawCard(state);
    }

    // Add forced initial hand cards
    if (state[S.turnsElapsed] == 0) {
      for (let i = 0; i < 2; i++) {
        const card = this.engine.cardManager.peekDeck(state);
        if (this.engine.cardManager.isForceInitialHand(state, card)) {
          this.engine.cardManager.drawCard(state);
        }
      }
    }

    state[S.cardUsesRemaining] = 1;
    this.engine.effectManager.triggerEffectsForPhase(state, "startOfTurn");
    this.engine.effectManager.triggerEffectsForPhase(state, "everyTurn");
  }

  endTurn(state) {
    // Recover stamina if turn ended by player
    if (state[S.cardUsesRemaining] > 0) {
      state[S.stamina] = Math.min(
        state[S.stamina] + 2,
        this.config.idol.params.stamina
      );
    }

    // Trigger effects
    this.engine.effectManager.triggerEffectsForPhase(state, "endOfTurn");

    // Decrement buff turns
    this.engine.buffManager.decrementBuffTurns(state);

    // Reset one turn fields
    state[S.cardUsesRemaining] = 0;
    state[S.turnCardsUsed] = 0;
    state[S.turnCardsUpgraded] = 0;
    state[S.enthusiasm] = 0;
    if (state[S.stance] == "fullPower") {
      this.engine.buffManager.resetStance(state);
    }

    // Decrement effect ttl
    this.engine.effectManager.decrementTtl(state);

    // Discard hand
    this.engine.cardManager.discardHand(state);

    state[S.turnsElapsed]++;
    state[S.turnsRemaining]--;

    this.logger.pushGraphData(state);

    // Start next turn
    if (state[S.turnsRemaining] > 0) {
      this.startTurn(state);
    }
  }
}
