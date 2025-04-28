import {
  DEBUFF_FIELDS,
  EOT_DECREMENT_FIELDS,
  S,
  UNFRESH_PHASES,
} from "../constants";
import EngineComponent from "./EngineComponent";

export default class BuffManager extends EngineComponent {
  constructor(engine) {
    super(engine);

    this.variableResolvers = {
      isPreservation: (state) => state[S.stance].startsWith("pre"),
      isStrength: (state) => state[S.stance].startsWith("str"),
      isNotStrength: (state) =>
        state[S.stance] == "none" || state[S.stance].startsWith("pre"),
      isFullPower: (state) => state[S.stance] == "fullPower",
    };
  }

  initializeState(state) {
    // General
    state[S.halfCostTurns] = 0;
    state[S.doubleCostTurns] = 0;
    state[S.costReduction] = 0;
    state[S.costIncrease] = 0;
    state[S.nullifyCostCards] = 0;
    state[S.nullifyDebuff] = 0;
    state[S.nullifyGenkiTurns] = 0;
    state[S.doubleCardEffectCards] = 0;
    state[S.noActiveTurns] = 0;
    state[S.noMentalTurns] = 0;
    state[S.poorConditionTurns] = 0;
    state[S.uneaseTurns] = 0;

    // Score buffs
    state[S.scoreBuffs] = [];

    // Sense
    state[S.goodConditionTurns] = 0;
    state[S.perfectConditionTurns] = 0;
    state[S.concentration] = 0;

    // Logic
    state[S.goodImpressionTurns] = 0;
    state[S.doubleGoodImpressionTurnsTurns] = 0;
    state[S.motivation] = 0;

    // Anomaly
    state[S.stance] = "none";
    state[S.lockStanceTurns] = 0;
    state[S.fullPowerCharge] = 0;
    state[S.cumulativeFullPowerCharge] = 0;
    state[S.enthusiasm] = 0;
    state[S.enthusiasmBonus] = 0;
    state[S.strengthTimes] = 0;
    state[S.preservationTimes] = 0;
    state[S.fullPowerTimes] = 0;

    // Buffs/debuffs protected from decrement
    state[S.freshBuffs] = {};
  }

  setScoreBuff(state, amount, turns) {
    const buffIndex = state[S.scoreBuffs].findIndex((b) => b.turns == turns);
    if (buffIndex != -1) {
      state[S.scoreBuffs][buffIndex].amount += amount;
    } else {
      state[S.scoreBuffs].push({
        amount,
        turns,
        fresh: !UNFRESH_PHASES.includes(state[S.phase]),
      });
    }
    this.logger.log(state, "setScoreBuff", {
      amount,
      turns,
    });
  }

  removeDebuffs(state, amount) {
    for (let i = 0; i < DEBUFF_FIELDS.length; i++) {
      const field = DEBUFF_FIELDS[i];
      if (state[field] > 0) {
        state[field]--;
        amount--;
        if (amount <= 0) {
          break;
        }
      }
    }
  }

  decrementBuffTurns(state) {
    // General buffs
    for (let i = 0; i < EOT_DECREMENT_FIELDS.length; i++) {
      const field = EOT_DECREMENT_FIELDS[i];
      if (state[S.freshBuffs][field]) {
        delete state[S.freshBuffs][field];
      } else if (state[field]) {
        state[field]--;
      }
    }

    // Score buffs
    const scoreBuffs = state[S.scoreBuffs];
    state[S.scoreBuffs] = [];
    for (let i = 0; i < scoreBuffs.length; i++) {
      if (scoreBuffs[i].fresh) {
        scoreBuffs[i].fresh = false;
      } else if (scoreBuffs[i].turns) {
        scoreBuffs[i].turns--;
      }
      if (scoreBuffs[i].turns != 0) {
        state[S.scoreBuffs].push(scoreBuffs[i]);
      }
    }
  }

  setStance(state, stance) {
    // Stance locked
    if (state[S.lockStanceTurns]) return;
    if (state[S.stance] == "fullPower") return;

    state[S.prevStance] = state[S.stance];

    if (stance.startsWith("preservation")) {
      if (state[S.stance].startsWith("preservation")) {
        state[S.stance] = "preservation2";
      } else {
        state[S.stance] = stance;
      }
    } else if (stance.startsWith("strength")) {
      if (state[S.stance].startsWith("strength")) {
        state[S.stance] = "strength2";
      } else {
        state[S.stance] = stance;
      }
    } else {
      state[S.stance] = stance;
    }

    if (
      state[S.stance] != state[S.prevStance] &&
      state[S.stance] != `${state[S.prevStance]}2`
    ) {
      this.engine.effectManager.triggerEffectsForPhase(state, "stanceChanged");
      if (state[S.stance].startsWith("preservation")) {
        state[S.preservationTimes]++;
      } else if (state[S.stance].startsWith("strength")) {
        state[S.strengthTimes]++;
      }
    }
  }

  resetStance(state) {
    state[S.prevStance] = state[S.stance];
    state[S.stance] = "none";
    this.engine.effectManager.triggerEffectsForPhase(state, "stanceChanged");
  }
}
