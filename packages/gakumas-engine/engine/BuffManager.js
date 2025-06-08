import {
  DEBUFF_FIELDS,
  EOT_DECREMENT_FIELDS,
  S,
  STANCE_CHANGED_EFFECTS,
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
      stanceChangedTimes: (state) =>
        state[S.strengthTimes] +
        state[S.preservationTimes] +
        state[S.fullPowerTimes],
      goodImpressionTurnsEffectBuff: (state) =>
        state[S.goodImpressionTurnsEffectBuffs].reduce(
          (acc, buff) => acc + buff.amount,
          1
        ),
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

    // Buffs
    state[S.scoreBuffs] = [];
    state[S.goodImpressionTurnsBuffs] = [];
    state[S.goodImpressionTurnsEffectBuffs] = [];

    // Sense
    state[S.goodConditionTurns] = 0;
    state[S.perfectConditionTurns] = 0;
    state[S.concentration] = 0;

    // Logic
    state[S.goodImpressionTurns] = 0;
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
    state[S.leisureTimes] = 0;

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

  setGoodImpressionTurnsBuff(state, amount, turns) {
    const buffIndex = state[S.goodImpressionTurnsBuffs].findIndex(
      (b) => b.turns == turns
    );
    if (buffIndex != -1) {
      state[S.goodImpressionTurnsBuffs][buffIndex].amount += amount;
    } else {
      state[S.goodImpressionTurnsBuffs].push({
        amount,
        turns,
        fresh: !UNFRESH_PHASES.includes(state[S.phase]),
      });
    }
    this.logger.log(state, "setGoodImpressionTurnsBuff", {
      amount,
      turns,
    });
  }

  setGoodImpressionTurnsEffectBuff(state, amount, turns) {
    const buffIndex = state[S.goodImpressionTurnsEffectBuffs].findIndex(
      (b) => b.turns == turns
    );
    if (buffIndex != -1) {
      state[S.goodImpressionTurnsEffectBuffs][buffIndex].amount += amount;
    } else {
      state[S.goodImpressionTurnsEffectBuffs].push({
        amount,
        turns,
        fresh: !UNFRESH_PHASES.includes(state[S.phase]),
      });
    }
    this.logger.log(state, "setGoodImpressionTurnsEffectBuff", {
      amount,
      turns,
    });
  }

  removeDebuffs(state, amount) {
    for (let i = 0; i < DEBUFF_FIELDS.length; i++) {
      const field = DEBUFF_FIELDS[i];
      if (state[field] > 0) {
        state[field] = 0;
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

    // Good impression turns buffs
    const goodImpressionTurnsBuffs = state[S.goodImpressionTurnsBuffs];
    state[S.goodImpressionTurnsBuffs] = [];
    for (let i = 0; i < goodImpressionTurnsBuffs.length; i++) {
      if (goodImpressionTurnsBuffs[i].fresh) {
        goodImpressionTurnsBuffs[i].fresh = false;
      } else if (goodImpressionTurnsBuffs[i].turns) {
        goodImpressionTurnsBuffs[i].turns--;
      }
      if (goodImpressionTurnsBuffs[i].turns != 0) {
        state[S.goodImpressionTurnsBuffs].push(goodImpressionTurnsBuffs[i]);
      }
    }

    // Good impression turns effect buffs
    const goodImpressionTurnsEffectBuffs =
      state[S.goodImpressionTurnsEffectBuffs];
    state[S.goodImpressionTurnsEffectBuffs] = [];
    for (let i = 0; i < goodImpressionTurnsEffectBuffs.length; i++) {
      if (goodImpressionTurnsEffectBuffs[i].fresh) {
        goodImpressionTurnsEffectBuffs[i].fresh = false;
      } else if (goodImpressionTurnsEffectBuffs[i].turns) {
        goodImpressionTurnsEffectBuffs[i].turns--;
      }
      if (goodImpressionTurnsEffectBuffs[i].turns != 0) {
        state[S.goodImpressionTurnsEffectBuffs].push(
          goodImpressionTurnsEffectBuffs[i]
        );
      }
    }
  }

  setStance(state, stance) {
    // Stance locked
    if (state[S.lockStanceTurns]) return;
    if (state[S.stance] == "fullPower") return;
    if (state[S.stance] == "leisure" && stance.startsWith("preservation"))
      return;

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
      this.engine.effectManager.triggerEffects(state, STANCE_CHANGED_EFFECTS);
      this.engine.effectManager.triggerEffectsForPhase(state, "stanceChanged");
      if (state[S.stance].startsWith("preservation")) {
        state[S.preservationTimes]++;
      } else if (state[S.stance].startsWith("strength")) {
        state[S.strengthTimes]++;
      } else if (state[S.stance] == "fullPower") {
        state[S.fullPowerTimes]++;
      } else if (state[S.stance] == "leisure") {
        state[S.leisureTimes]++;
      }
    }
  }

  resetStance(state) {
    state[S.prevStance] = state[S.stance];
    state[S.stance] = "none";
    this.engine.effectManager.triggerEffectsForPhase(state, "stanceChanged");
  }
}
