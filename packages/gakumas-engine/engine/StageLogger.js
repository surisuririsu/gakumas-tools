import { DEBUG, GRAPHED_FIELDS, LOGGED_FIELDS, S } from "../constants";
import { deepCopy } from "../utils";

export default class StageLogger {
  initializeState(state) {
    state.logs = [];
    state.graphData = {};
    for (let i = 0; i < GRAPHED_FIELDS.length; i++) {
      state.graphData[GRAPHED_FIELDS[i]] = [];
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
    const logs = state.logs.map((logIndex) => this.logs[logIndex]);
    this.logs = [];
    return logs;
  }

  log(state, logType, data) {
    if (this.disabled) return;
    this.logs.push({ logType, data });
    const idx = this.logs.length - 1;
    state.logs.push(idx);
    return idx;
  }

  debug(...args) {
    if (!DEBUG || this.disabled) return;
    console.log(...args);
  }

  pushGraphData(state) {
    if (this.disabled) return;
    for (let i = 0; i < GRAPHED_FIELDS.length; i++) {
      state.graphData[GRAPHED_FIELDS[i]].push(state[GRAPHED_FIELDS[i]]);
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
    if (state[S.scoreBuffs].length) {
      res[S.scoreBuffs] = deepCopy(state[S.scoreBuffs]);
    }
    if (state[S.goodImpressionTurnsBuffs].length) {
      res[S.goodImpressionTurnsBuffs] = deepCopy(
        state[S.goodImpressionTurnsBuffs]
      );
    }
    return res;
  }
}
