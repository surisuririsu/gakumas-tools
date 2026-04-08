import {
  LegacyIdolConfig,
  LegacyIdolStageConfig,
  LegacyStageConfig,
  LegacyStageEngine,
  LegacyStagePlayer,
  LEGACY_STRATEGIES,
  StructuredIdolConfig,
  StructuredIdolStageConfig,
  StructuredStageConfig,
  StructuredStageEngine,
  StructuredStagePlayer,
  STRUCTURED_STRATEGIES,
} from "../../packages/gakumas-engine/index.js";
import {
  LegacyStages,
  StructuredStages,
} from "../../packages/gakumas-data/index.js";
import { readFile } from "node:fs/promises";

function deserializeIds(str) {
  return str.split("-").map((n) => parseInt(n, 10) || 0);
}

function deserializeCustomizations(str) {
  try {
    return str.split("-").map((c) =>
      c
        .split("e")
        .filter((e) => e)
        .reduce((acc, cur) => {
          const [k, v] = cur.split("x");
          acc[k] = parseInt(v, 10);
          return acc;
        }, {}),
    );
  } catch (e) {
    console.error(e);
    return [];
  }
}

export function loadoutFromQuery(queryString) {
  const searchParams = new URLSearchParams(queryString);
  const skillCardIdGroups = (searchParams.get("cards") || "")
    .split("_")
    .map(deserializeIds);
  let customizationGroups = (searchParams.get("customizations") || "")
    .split("_")
    .map(deserializeCustomizations);

  if (skillCardIdGroups.length != customizationGroups.length) {
    customizationGroups = skillCardIdGroups.map((g) => g.map(() => ({})));
  }

  const stageId = parseInt(searchParams.get("stage"), 10);

  return {
    stageId,
    supportBonus: parseFloat(searchParams.get("support_bonus")) || null,
    params: deserializeIds(searchParams.get("params") || ""),
    pItemIds: deserializeIds(searchParams.get("items") || ""),
    skillCardIdGroups,
    customizationGroups,
  };
}

function buildConfig(loadout, Configs) {
  const idol = new Configs.IdolConfig(loadout);
  const stage = new Configs.StageConfig(Configs.Stages.getById(loadout.stageId));
  return new Configs.IdolStageConfig(idol, stage, loadout.enterPercents);
}

function runStrategy(config, Engine, Player, Strategy) {
  const engine = new Engine(config);
  const strategy = new Strategy(engine);
  engine.strategy = strategy;
  return new Player(engine, strategy).play();
}

export function buildComparisonConfigs(loadout) {
  return {
    legacy: buildConfig(loadout, {
      IdolConfig: LegacyIdolConfig,
      StageConfig: LegacyStageConfig,
      IdolStageConfig: LegacyIdolStageConfig,
      Stages: LegacyStages,
    }),
    structured: buildConfig(loadout, {
      IdolConfig: StructuredIdolConfig,
      StageConfig: StructuredStageConfig,
      IdolStageConfig: StructuredIdolStageConfig,
      Stages: StructuredStages,
    }),
  };
}

export async function compareEngines(
  loadout,
  strategyName = "HeuristicStrategy",
) {
  const configs = buildComparisonConfigs(loadout);
  const LegacyStrategy = LEGACY_STRATEGIES[strategyName];
  const StructuredStrategy = STRUCTURED_STRATEGIES[strategyName];

  if (!LegacyStrategy || !StructuredStrategy) {
    throw new Error(`Unknown strategy: ${strategyName}`);
  }

  const [legacy, structured] = await Promise.all([
    runStrategy(
      configs.legacy,
      LegacyStageEngine,
      LegacyStagePlayer,
      LegacyStrategy,
    ),
    runStrategy(
      configs.structured,
      StructuredStageEngine,
      StructuredStagePlayer,
      StructuredStrategy,
    ),
  ]);

  return {
    legacy,
    structured,
    scoreDelta: structured.score - legacy.score,
  };
}

export async function compareQueryStrings(queryStrings, strategyName) {
  const results = [];
  for (let i = 0; i < queryStrings.length; i++) {
    const queryString = queryStrings[i];
    const loadout = loadoutFromQuery(queryString);
    try {
      const result = await compareEngines(loadout, strategyName);
      results.push({
        index: i + 1,
        queryString,
        legacyScore: result.legacy.score,
        structuredScore: result.structured.score,
        scoreDelta: result.scoreDelta,
        passed: result.scoreDelta === 0,
      });
    } catch (error) {
      results.push({
        index: i + 1,
        queryString,
        error,
        passed: false,
      });
    }
  }
  return results;
}

async function main() {
  const urlsFile = process.argv[2];
  if (!urlsFile) return;

  const text = await readFile(urlsFile, "utf8");
  const queryStrings = text
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  const originalConsole = { ...console };
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};
  console.warn = () => {};
  console.error = () => {};
  const results = await compareQueryStrings(queryStrings);
  Object.assign(console, originalConsole);

  const passed = results.filter((result) => result.passed).length;
  const failed = results.length - passed;

  for (const result of results) {
    if (result.passed) {
      console.log(`PASS ${result.index}: ${result.legacyScore}`);
    } else if (result.error) {
      console.log(`ERROR ${result.index}: ${result.error.message}`);
      console.log(`  ${result.queryString}`);
    } else {
      console.log(
        `FAIL ${result.index}: legacy=${result.legacyScore} structured=${result.structuredScore} delta=${result.scoreDelta}`,
      );
      console.log(`  ${result.queryString}`);
    }
  }

  console.log("");
  console.log(`Results: ${passed} passed, ${failed} failed`);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
