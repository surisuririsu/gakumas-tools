/**
 * Walks every DSL field across the structured data JSON files and reports
 * any unknown phase, identifier, function, or field name.
 *
 * Run via:
 *   node --loader ./scripts/test-compare/extensionless-loader.mjs \
 *        ./scripts/validate-data.mjs
 *
 * Exit code is non-zero if any validation errors were found.
 *
 * JSON is read fresh from disk rather than imported — otherwise any
 * transitive import of `gakumas-data-structured` (e.g. via the schema
 * introspecting engine components) runs its side-effectful deserializer
 * and mutates the module-cached JSON in place, leaving us with ASTs
 * instead of the raw DSL strings the validator needs.
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import { parseEffects, parsePatches } from "gakumas-data/utils/parser";
import {
  validateEffectAst,
  validatePatchAst,
} from "gakumas-data/utils/validator";

const JSON_DIR = resolve(
  dirname(fileURLToPath(import.meta.url)),
  "../packages/gakumas-data/json",
);
const readJson = (name) =>
  JSON.parse(readFileSync(resolve(JSON_DIR, name), "utf8"));

const CUSTOMIZATIONS = readJson("customizations.json");
const SKILL_CARDS = readJson("skill_cards.json");
const P_ITEMS = readJson("p_items.json");
const STAGES = readJson("stages.json");
const P_DRINKS = readJson("p_drinks.json");

let totalErrors = 0;

function report(entity, id, column, src, errors) {
  if (!errors.length) return;
  totalErrors += errors.length;
  console.error(`${entity}#${id} [${column}]: ${JSON.stringify(src)}`);
  for (const err of errors) console.error(`  - ${err}`);
}

function validateEffectField(entity, id, column, src) {
  if (src == null || !String(src).trim()) return;
  try {
    const ast = parseEffects(String(src));
    report(entity, id, column, src, validateEffectAst(ast));
  } catch (err) {
    totalErrors++;
    console.error(`${entity}#${id} [${column}]: ${JSON.stringify(src)}`);
    console.error(`  - Parse error: ${err.message}`);
  }
}

function validatePatchField(entity, id, column, src) {
  if (src == null || !String(src).trim()) return;
  try {
    const ast = parsePatches(String(src));
    report(entity, id, column, src, validatePatchAst(ast));
  } catch (err) {
    totalErrors++;
    console.error(`${entity}#${id} [${column}]: ${JSON.stringify(src)}`);
    console.error(`  - Parse error: ${err.message}`);
  }
}

// --- Skill cards ---
// `actions`: immediate actions played when the card is used.
// `effects`: triggered effects (at:phase) registered when the card enters play.
for (const card of SKILL_CARDS) {
  validateEffectField("skillCard", card.id, "conditions", card.conditions);
  validateEffectField("skillCard", card.id, "cost", card.cost);
  validateEffectField("skillCard", card.id, "actions", card.actions);
  validateEffectField("skillCard", card.id, "effects", card.effects);
}

// --- Customizations (patch sequences, mirroring skill_cards columns) ---
for (const cust of CUSTOMIZATIONS) {
  validatePatchField("customization", cust.id, "conditions", cust.conditions);
  validatePatchField("customization", cust.id, "cost", cust.cost);
  validatePatchField("customization", cust.id, "actions", cust.actions);
  validatePatchField("customization", cust.id, "effects", cust.effects);
}

// --- P-items / stages: triggered effects only ---
for (const item of P_ITEMS) {
  validateEffectField("pItem", item.id, "effects", item.effects);
}
for (const stage of STAGES) {
  validateEffectField("stage", stage.id, "effects", stage.effects);
}
// --- P-drinks: immediate actions only ---
for (const drink of P_DRINKS) {
  validateEffectField("pDrink", drink.id, "actions", drink.actions);
}

if (totalErrors > 0) {
  console.error(`\nFound ${totalErrors} validation error(s).`);
  process.exit(1);
}
console.log("All DSL references validated — 0 errors.");
