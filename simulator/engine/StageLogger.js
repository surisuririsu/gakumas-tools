import { GRAPHED_FIELDS } from "../constants";

export default class StageLogger {
  constructor(debugEnabled) {
    this.disabled = false;
    this.debugEnabled = debugEnabled;
    this.clear();
  }

  disable() {
    this.disabled = true;
  }

  enable() {
    this.disabled = false;
  }

  log(logType, data) {
    if (this.disabled) return;
    this.logs.push({ logType, data });
  }

  debug(...args) {
    if (!this.debugEnabled || this.disabled) return;
    console.log(...args);
  }

  pushGraphData(state) {
    if (this.disabled) return;
    for (let i = 0; i < GRAPHED_FIELDS.length; i++) {
      this.graphData[GRAPHED_FIELDS[i]].push(state[GRAPHED_FIELDS[i]]);
    }
  }

  clear() {
    this.logs = [];
    this.graphData = {};
    for (let i = 0; i < GRAPHED_FIELDS.length; i++) {
      this.graphData[GRAPHED_FIELDS[i]] = [];
    }
  }
}
