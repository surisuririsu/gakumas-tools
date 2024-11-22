import { SkillCards } from "gakumas-data/lite";
import EngineComponent from "./EngineComponent";
import { shuffle } from "./utils";

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
    state.turnsElapsed = 0;
    state.turnsRemaining = this.config.stage.turnCount;
    state.turnTypes = this.generateTurnTypes();
  }

  getTurnType(state) {
    return state.turnTypes[
      Math.min(state.turnsElapsed, this.config.stage.turnCount - 1)
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
    const rand = Math.random();
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
    this.logger.debug("Starting turn", state.turnsElapsed + 1);

    this.logger.log("startTurn", {
      num: state.turnsElapsed + 1,
      type: this.getTurnType(state),
      multiplier: this.getTurnMultiplier(state),
    });

    // Draw cards
    for (let i = 0; i < 3; i++) {
      this.engine.cardManager.drawCard(state);
    }

    // Add forced initial hand cards
    if (state.turnsElapsed == 0) {
      for (let i = 0; i < 2; i++) {
        const card = this.engine.cardManager.peekDeck(state);
        if (SkillCards.getById(state.cardMap[card].id).forceInitialHand) {
          this.engine.cardManager.drawCard(state);
        }
      }
    }

    state.cardUsesRemaining = 1;
    this.engine.effectManager.triggerEffectsForPhase(state, "startOfTurn");
    this.engine.effectManager.triggerEffectsForPhase(state, "everyTurn");
  }

  endTurn(state) {
    // Recover stamina if turn ended by player
    if (state.cardUsesRemaining > 0) {
      state.stamina = Math.min(
        state.stamina + 2,
        this.config.idol.params.stamina
      );
    }

    // Trigger effects
    this.engine.effectManager.triggerEffectsForPhase(state, "endOfTurn");

    // Decrement buff turns
    this.engine.buffManager.decrementBuffTurns(state);

    // Reset one turn fields
    state.cardUsesRemaining = 0;
    state.turnCardsUsed = 0;
    state.turnCardsUpgraded = 0;
    state.enthusiasm = 0;
    if (state.stance == "fullPower") {
      this.engine.buffManager.resetStance(state);
    }

    // Decrement effect ttl
    this.engine.effectManager.decrementTtl(state);

    // Discard hand
    this.engine.cardManager.discardHand(state);

    state.turnsElapsed++;
    state.turnsRemaining--;

    this.logger.pushGraphData(state);

    // Start next turn
    if (state.turnsRemaining > 0) {
      this.startTurn(state);
    }
  }
}
