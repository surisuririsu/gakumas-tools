export default class StageLogger {
  constructor(debugging) {
    this.debugging = debugging;
    this.disabled = false;
    this.logs = [];
  }

  log(logType, data) {
    if (this.disabled) return;
    this.logs.push({ logType, data });
  }

  debug(...args) {
    if (this.disabled || !this.debugging) return;
    console.log(...args);
  }

  clear() {
    this.logs = [];
  }
}
