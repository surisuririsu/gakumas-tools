import {
  DEBUFF_FIELDS,
  EOT_DECREMENT_FIELDS,
  S,
  STANCE_CHANGED_EFFECTS,
  UNFRESH_PHASES,
} from "../constants.js";
import EngineComponent from "./EngineComponent.js";

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

    this.specialActions = {
      setScoreBuff: (state, amount, turns) =>
        this.setScoreBuff(
          state,
          parseFloat(amount),
          turns ? parseInt(turns, 10) : null
        ),
      setScoreDebuff: (state, amount, turns) =>
        this.setScoreDebuff(
          state,
          parseFloat(amount),
          turns ? parseInt(turns, 10) : null
        ),
      setGoodImpressionTurnsBuff: (state, amount, turns) =>
        this.setGoodImpressionTurnsBuff(
          state,
          parseFloat(amount),
          turns ? parseInt(turns, 10) : null
        ),
      setGoodImpressionTurnsEffectBuff: (state, amount, turns) =>
        this.setGoodImpressionTurnsEffectBuff(
          state,
          parseFloat(amount),
          turns ? parseInt(turns, 10) : null
        ),
      setMotivationBuff: (state, amount, turns) =>
        this.setMotivationBuff(
          state,
          parseFloat(amount),
          turns ? parseInt(turns, 10) : null
        ),
      setGoodConditionTurnsBuff: (state, amount, turns) =>
        this.setGoodConditionTurnsBuff(
          state,
          parseFloat(amount),
          turns ? parseInt(turns, 10) : null
        ),
      setConcentrationBuff: (state, amount, turns) =>
        this.setConcentrationBuff(
          state,
          parseFloat(amount),
          turns ? parseInt(turns, 10) : null
        ),
      setEnthusiasmBuff: (state, amount, turns) =>
        this.setEnthusiasmBuff(
          state,
          parseFloat(amount),
          turns ? parseInt(turns, 10) : null
        ),
      setFullPowerChargeBuff: (state, amount, turns) =>
        this.setFullPowerChargeBuff(
          state,
          parseFloat(amount),
          turns ? parseInt(turns, 10) : null
        ),
      removeDebuffs: (state, amount) =>
        this.removeDebuffs(state, parseInt(amount, 10)),
      setStance: (state, stance) => this.setStance(state, stance),
      decreaseFullPowerCharge: (state, amount) => {
        state[S.fullPowerCharge] = Math.max(
          0,
          state[S.fullPowerCharge] - parseInt(amount, 10)
        );
      },
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
    state[S.noCardUseTurns] = 0;
    state[S.poorConditionTurns] = 0;
    state[S.uneaseTurns] = 0;

    // Buffs
    state[S.scoreBuffs] = [];
    state[S.scoreDebuffs] = [];
    state[S.goodImpressionTurnsBuffs] = [];
    state[S.goodImpressionTurnsEffectBuffs] = [];
    state[S.motivationBuffs] = [];
    state[S.goodConditionTurnsBuffs] = [];
    state[S.concentrationBuffs] = [];
    state[S.enthusiasmBuffs] = [];
    state[S.fullPowerChargeBuffs] = [];

    // Sense
    state[S.goodConditionTurns] = 0;
    state[S.perfectConditionTurns] = 0;
    state[S.concentration] = 0;

    // Logic
    state[S.goodImpressionTurns] = 0;
    state[S.motivation] = 0;
    state[S.prideTurns] = 0;

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

    // Deltas
    state[S.goodImpressionTurnsDelta] = 0;
    state[S.motivationDelta] = 0;
    state[S.genkiDelta] = 0;
    state[S.goodConditionTurnsDelta] = 0;
    state[S.concentrationDelta] = 0;
    state[S.staminaDelta] = 0;

    // Other
    state[S.nullifySelect] = 0;
  }

  setBuff(state, field, amount, turns, logLabel) {
    const buffIndex = state[field].findIndex((b) => b.turns == turns);
    if (buffIndex != -1) {
      state[field][buffIndex].amount += amount;
    } else {
      state[field].push({
        amount,
        turns,
        fresh: !UNFRESH_PHASES.includes(state[S.phase]),
      });
    }
    this.logger.log(state, logLabel, {
      amount,
      turns,
    });
  }

  setScoreBuff(state, amount, turns) {
    this.setBuff(state, S.scoreBuffs, amount, turns, "setScoreBuff");
  }

  setScoreDebuff(state, amount, turns) {
    this.setBuff(state, S.scoreDebuffs, amount, turns, "setScoreDebuff");
  }

  setGoodImpressionTurnsBuff(state, amount, turns) {
    this.setBuff(
      state,
      S.goodImpressionTurnsBuffs,
      amount,
      turns,
      "setGoodImpressionTurnsBuff"
    );
  }

  setGoodImpressionTurnsEffectBuff(state, amount, turns) {
    this.setBuff(
      state,
      S.goodImpressionTurnsEffectBuffs,
      amount,
      turns,
      "setGoodImpressionTurnsEffectBuff"
    );
  }

  setMotivationBuff(state, amount, turns) {
    this.setBuff(state, S.motivationBuffs, amount, turns, "setMotivationBuff");
  }

  setGoodConditionTurnsBuff(state, amount, turns) {
    this.setBuff(
      state,
      S.goodConditionTurnsBuffs,
      amount,
      turns,
      "setGoodConditionTurnsBuff"
    );
  }

  setConcentrationBuff(state, amount, turns) {
    this.setBuff(
      state,
      S.concentrationBuffs,
      amount,
      turns,
      "setConcentrationBuff"
    );
  }

  setEnthusiasmBuff(state, amount, turns) {
    this.setBuff(state, S.enthusiasmBuffs, amount, turns, "setEnthusiasmBuff");
  }

  setFullPowerChargeBuff(state, amount, turns) {
    this.setBuff(
      state,
      S.fullPowerChargeBuffs,
      amount,
      turns,
      "setFullPowerChargeBuff"
    );
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

    const buffArrayFields = [
      S.scoreBuffs,
      S.scoreDebuffs,
      S.goodImpressionTurnsBuffs,
      S.goodImpressionTurnsEffectBuffs,
      S.motivationBuffs,
      S.goodConditionTurnsBuffs,
      S.concentrationBuffs,
      S.enthusiasmBuffs,
      S.fullPowerChargeBuffs,
    ];

    for (const field of buffArrayFields) {
      const buffs = state[field];
      state[field] = [];
      for (let i = 0; i < buffs.length; i++) {
        if (buffs[i].fresh) {
          buffs[i].fresh = false;
        } else if (buffs[i].turns) {
          buffs[i].turns--;
        }
        if (buffs[i].turns != 0) {
          state[field].push(buffs[i]);
        }
      }
    }
  }

  setStance(state, stance) {
    // Stance locked
    if (state[S.stance] == "fullPower") {
      if (stance != "none") return;
    } else if (state[S.lockStanceTurns]) return;

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
  }
}
