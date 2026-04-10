import { readFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

const EFFECT_FIELDS_BY_TYPE = {
  customizations: ["conditions", "cost", "effects", "growth"],
  pDrinks: ["effects"],
  pItems: ["effects"],
  skillCards: ["conditions", "cost", "effects", "growth"],
  stages: ["effects"],
};

const DATASET_FILES = {
  customizations: "customizations.json",
  pDrinks: "p_drinks.json",
  pItems: "p_items.json",
  skillCards: "skill_cards.json",
  stages: "stages.json",
};

const REVIEW_DIR = path.dirname(fileURLToPath(import.meta.url));
const STRUCTURED_JSON_DIR = path.resolve(REVIEW_DIR, "../json");
const LEGACY_JSON_DIR = path.resolve(REVIEW_DIR, "../../gakumas-data/json");

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

export async function getReviewDataset(type) {
  const fileName = DATASET_FILES[type];
  const fields = EFFECT_FIELDS_BY_TYPE[type];
  if (!fileName) {
    throw new Error(`Unknown review dataset type: ${type}`);
  }

  const [legacy, structured] = await Promise.all([
    readJson(path.join(LEGACY_JSON_DIR, fileName)),
    readJson(path.join(STRUCTURED_JSON_DIR, fileName)),
  ]);
  const reviewEntries = legacy.filter((entity) =>
    fields.some((field) => entity?.[field]),
  );
  const structuredById = new Map(
    structured.map((entity) => [String(entity.id), entity]),
  );

  return {
    entries: reviewEntries.map((entity) => ({
      id: entity.id,
      name: entity.name || entity.alias,
    })),
    getLegacyById(id) {
      return reviewEntries.find((entity) => String(entity.id) === String(id));
    },
    getStructuredById(id) {
      return structuredById.get(String(id));
    },
  };
}
