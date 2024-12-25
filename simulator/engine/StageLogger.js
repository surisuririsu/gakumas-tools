import { DEBUG, GRAPHED_FIELDS, LOGGED_FIELDS, S } from "../constants";
import { deepCopy } from "./utils";

export default class StageLogger {
  initializeState(state) {
    state.logs = [];
    state.graphData = {};
    for (let i = 0; i < GRAPHED_FIELDS.length; i++) {
      state.graphData[S[GRAPHED_FIELDS[i]]] = [];
    }
    this.disabled = false;
  }

  disable() {
    this.disabled = true;
  }

  enable() {
    this.disabled = false;
  }

  log(state, logType, data) {
    if (this.disabled) return;
    state.logs.push({ logType, data });
  }

  debug(...args) {
    if (!DEBUG || this.disabled) return;
    console.log(...args);
  }

  pushGraphData(state) {
    if (this.disabled) return;
    for (let i = 0; i < GRAPHED_FIELDS.length; i++) {
      state.graphData[S[GRAPHED_FIELDS[i]]].push(state[S[GRAPHED_FIELDS[i]]]);
    }
  }

  getHandStateForLogging(state) {
    let res = {};
    for (let i = 0; i < LOGGED_FIELDS.length; i++) {
      if (LOGGED_FIELDS[i] == "turnsRemaining") continue;
      if (LOGGED_FIELDS[i] == "cardUsesRemaining") continue;
      if (state[S[LOGGED_FIELDS[i]]]) {
        res[S[LOGGED_FIELDS[i]]] = state[S[LOGGED_FIELDS[i]]];
      }
    }
    if (state[S.scoreBuffs].length) {
      res[S.scoreBuffs] = deepCopy(state[S.scoreBuffs]);
    }
    return res;
  }
}
