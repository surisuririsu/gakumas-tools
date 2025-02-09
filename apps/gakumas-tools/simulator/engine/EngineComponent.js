export default class EngineComponent {
  constructor(engine) {
    this.engine = engine;
    this.config = engine.config;
    this.logger = engine.logger;
  }
}
