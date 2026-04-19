export default class EngineComponent {
  constructor(engine) {
    this.engine = engine;
    this.logger = engine.logger;
  }

  getConfig(state) {
    return this.engine.getConfig(state);
  }
}
