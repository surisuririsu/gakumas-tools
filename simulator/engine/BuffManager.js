import { UNFRESH_PHASES } from "@/simulator/constants";
import { EOT_DECREMENT_FIELDS } from "../constants";
import EngineComponent from "./EngineComponent";

export default class BuffManager extends EngineComponent {
  constructor(engine) {
    super(engine);

    this.variableResolvers = {
      isPreservation: (state) => state.stance.startsWith("preservation"),
      isStrength: (state) => state.stance.startsWith("strength"),
      isFullPower: (state) => state.stance == "fullPower",
    };
  }

  initializeState(state) {
    // General
    state.halfCostTurns = 0;
    state.doubleCostTurns = 0;
    state.costReduction = 0;
    state.costIncrease = 0;
    state.nullifyCostCards = 0;
    state.nullifyDebuff = 0;
    state.nullifyGenkiTurns = 0;
    state.doubleCardEffectCards = 0;
    state.poorConditionTurns = 0;

    // Score buffs
    state.scoreBuffs = [];

    // Sense
    state.goodConditionTurns = 0;
    state.perfectConditionTurns = 0;
    state.concentration = 0;

    // Logic
    state.goodImpressionTurns = 0;
    state.motivation = 0;

    // Anomaly
    state.stance = "none";
    state.lockStanceTurns = 0;
    state.fullPowerCharge = 0;
    state.cumulativeFullPowerCharge = 0;
    state.enthusiasm = 0;
    state.strengthTimes = 0;
    state.preservationTimes = 0;
    state.fullPowerTimes = 0;

    // Buffs/debuffs protected from decrement
    state.freshBuffs = {};
  }

  setScoreBuff(state, amount, turns) {
    const buffIndex = state.scoreBuffs.findIndex((b) => b.turns == turns);
    if (buffIndex != -1) {
      state.scoreBuffs[buffIndex].amount += amount;
    } else {
      state.scoreBuffs.push({
        amount,
        turns,
        fresh: !UNFRESH_PHASES.includes(state.phase),
      });
    }
    this.logger.log("setScoreBuff", {
      amount,
      turns,
    });
  }

  decrementBuffTurns(state) {
    // General buffs
    for (let i = 0; i < EOT_DECREMENT_FIELDS.length; i++) {
      const field = EOT_DECREMENT_FIELDS[i];
      if (state.freshBuffs[field]) {
        delete state.freshBuffs[field];
      } else if (state[field]) {
        state[field]--;
      }
    }

    // Score buffs
    const scoreBuffs = state.scoreBuffs;
    state.scoreBuffs = [];
    for (let i = 0; i < scoreBuffs.length; i++) {
      if (scoreBuffs[i].fresh) {
        scoreBuffs[i].fresh = false;
      } else if (scoreBuffs[i].turns) {
        scoreBuffs[i].turns--;
      }
      if (scoreBuffs[i].turns != 0) {
        state.scoreBuffs.push(scoreBuffs[i]);
      }
    }
  }

  setStance(state, stance) {
    // Stance locked
    if (state.lockStanceTurns) return;

    state.prevStance = state.stance;

    if (stance.startsWith("preservation")) {
      if (state.stance.startsWith("preservation")) {
        state.stance = "preservation2";
      } else {
        state.stance = stance;
      }
    } else if (stance.startsWith("strength")) {
      if (state.stance.startsWith("strength")) {
        state.stance = "strength2";
      } else {
        state.stance = stance;
      }
    } else {
      state.stance = stance;
    }

    if (
      state.stance != state.prevStance &&
      state.stance != `${state.prevStance}2`
    ) {
      this.engine.effectManager.triggerEffectsForPhase(state, "stanceChanged");
      if (state.stance.startsWith("preservation")) {
        state.preservationTimes++;
      } else if (state.stance.startsWith("strength")) {
        state.strengthTimes++;
      }
    }
  }

  resetStance(state) {
    state.prevStance = state.stance;
    state.stance = "none";
    this.engine.effectManager.triggerEffectsForPhase(state, "stanceChanged");
  }
}
