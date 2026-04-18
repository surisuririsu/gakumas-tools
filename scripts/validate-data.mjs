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
 * Imports parser/validator via sub-paths so the data-package side effect
 * (which mutates the imported JSON in place by deserializing strings) doesn't
 * run — we need the raw source strings.
 */
import { parseEffects, parsePatches } from "gakumas-data-structured/utils/parser";
import {
  validateEffectAst,
  validatePatchAst,
} from "gakumas-data-structured/utils/validator";
import CUSTOMIZATIONS from "gakumas-data-structured/json/customizations.json";
import SKILL_CARDS from "gakumas-data-structured/json/skill_cards.json";
import P_ITEMS from "gakumas-data-structured/json/p_items.json";
import STAGES from "gakumas-data-structured/json/stages.json";
import P_DRINKS from "gakumas-data-structured/json/p_drinks.json";

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
