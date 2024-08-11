import { DEBUG } from "./constants";

export default class StageLogger {
  constructor() {
    this.disabled = false;
    this.logs = [];
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
    if (!DEBUG || this.disabled) return;
    console.log(...args);
  }

  clear() {
    this.logs = [];
  }
}
