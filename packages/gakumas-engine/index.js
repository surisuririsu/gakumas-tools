export * from "./config";
export * from "./engine";
export { default as STRATEGIES } from "./strategies";
export * from "./constants";
export { resetRand } from "./utils";
// Legacy-prefixed aliases of the default exports above. Same modules,
// just handier when both engines are referenced side by side (e.g., in
// parity-test scripts that import Structured* from gakumas-engine/structured).
export { default as LegacyIdolConfig } from "./config/IdolConfig";
export { default as LegacyStageConfig } from "./config/StageConfig";
export { default as LegacyIdolStageConfig } from "./config/IdolStageConfig";
export { default as LegacyStageEngine } from "./engine/StageEngine";
export { default as LegacyStagePlayer } from "./engine/StagePlayer";
export { default as LEGACY_STRATEGIES } from "./strategies";
// NOTE: the structured engine is deliberately NOT re-exported here.
// The structured engine imports gakumas-data-structured, whose data-loader
// modules have top-level side effects (deserializing JSON into ASTs on
// import), which defeats webpack's tree-shaking. Re-exporting through this
// barrel forced every page that imported from `gakumas-engine` — e.g., the
// simulator — to bundle the entire structured dataset alongside the legacy
// one, roughly doubling client memory. Import structured entry points
// directly from `gakumas-engine/structured` instead.
