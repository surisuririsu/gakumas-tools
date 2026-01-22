import { DEBUG, GRAPHED_FIELDS, LOGGED_FIELDS, S } from "../constants.js";
import { deepCopy } from "../utils.js";

const LOGGED_BUFFS_FIELDS = [
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

export default class StageLogger {
  constructor(engine) {
    this.engine = engine;
    this.reset();
  }

  initializeState(state) {
    state[S.logs] = [];
    state[S.graphData] = {};
    for (let i = 0; i < GRAPHED_FIELDS.length; i++) {
      state[S.graphData][GRAPHED_FIELDS[i]] = [];
    }
  }

  reset() {
    this.logs = [];
    this.disabled = false;
  }

  disable() {
    this.disabled = true;
  }

  enable() {
    this.disabled = false;
  }

  pickLogs(state) {
    const logs = state[S.logs].map((logIndex) => this.logs[logIndex]);
    this.logs = [];
    return logs;
  }

  log(state, logType, data) {
    if (this.disabled) return;
    this.logs.push({ logType, data });
    const idx = this.logs.length - 1;
    state[S.logs].push(idx);
    return idx;
  }

  debug(...args) {
    if (!DEBUG || this.disabled) return;
    console.log(...args);
  }

  pushGraphData(state) {
    if (this.disabled) return;
    for (let i = 0; i < GRAPHED_FIELDS.length; i++) {
      state[S.graphData][GRAPHED_FIELDS[i]].push(state[GRAPHED_FIELDS[i]]);
    }
  }

  getHandStateForLogging(state) {
    let res = {};
    for (let i = 0; i < LOGGED_FIELDS.length; i++) {
      if (LOGGED_FIELDS[i] == S.turnsRemaining) continue;
      if (LOGGED_FIELDS[i] == S.cardUsesRemaining) continue;
      if (state[LOGGED_FIELDS[i]]) {
        res[LOGGED_FIELDS[i]] = state[LOGGED_FIELDS[i]];
      }
    }

    for (let field of LOGGED_BUFFS_FIELDS) {
      if (state[field]?.length) {
        res[field] = deepCopy(state[field]);
      }
    }

    res.turn = {
      types: state[S.turnTypes],
      remaining: state[S.turnsRemaining],
      multiplier: this.engine.turnManager.getTurnMultiplier(state),
    };

    return res;
  }
}
