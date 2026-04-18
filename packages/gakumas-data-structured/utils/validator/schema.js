/**
 * Validator schema.
 *
 * Whitelists of every identifier/function/phase/field the structured
 * engine understands. The validator walks parsed ASTs and flags any name
 * not in these sets — catches migration typos and DSL drift at data-build
 * time instead of during silent test divergence.
 *
 * SPECIAL_ACTIONS and VARIABLE_RESOLVERS are derived by instantiating the
 * real engine components against a stub engine and reading back the keys
 * of their `specialActions` / `variableResolvers` maps. This keeps the
 * schema in lockstep with the engine automatically — adding or renaming
 * an action in CardManager/BuffManager updates the schema on the next
 * validator run with no manual edits.
 *
 * PHASES and STATE_FIELDS are still hand-maintained for now (PHASES is a
 * string constant in engine/constants.js; STATE_FIELDS mirrors ALL_FIELDS
 * there). If either becomes a drift source, apply the same introspection
 * treatment.
 */
import TurnManager from "gakumas-engine/structured/engine/TurnManager";
import CardManager from "gakumas-engine/structured/engine/CardManager";
import BuffManager from "gakumas-engine/structured/engine/BuffManager";
import Evaluator from "gakumas-engine/structured/engine/Evaluator";

// Phases that `at:<phase>` may reference.
// Mirrors PHASES in packages/gakumas-engine/structured/constants.js.
export const PHASES = new Set([
  "activeCardUsed",
  "afterActiveCardUsed",
  "afterCardUsed",
  "afterMentalCardUsed",
  "afterStartOfStage",
  "afterStartOfTurn",
  "beforeStartOfTurn",
  "buffCostConsumed",
  "cardUsed",
  "cardMovedToHand",
  "cardMovedToHeld",
  "cardRemoved",
  "concentrationIncreased",
  "endOfTurn",
  "everyTurn",
  "fullPowerChargeIncreased",
  "genkiIncreased",
  "goodConditionTurnsIncreased",
  "goodImpressionTurnsIncreased",
  "mentalCardUsed",
  "motivationIncreased",
  "prestage",
  "processCard",
  "processCost",
  "checkCost",
  "staminaDecreased",
  "stanceChanged",
  "startOfStage",
  "startOfTurn",
  "turn",
  "turnSkipped",
]);

// Mutable state fields — anything in ALL_FIELDS (engine constants).
// Also usable on the RHS of expressions as a readable value.
export const STATE_FIELDS = new Set([
  "logs",
  "graphData",
  "cardUsesRemaining",
  "stamina",
  "consumedStamina",
  "genki",
  "consumedGenki",
  "score",
  "turnsElapsed",
  "turnsRemaining",
  "turnTypes",
  "linkPhase",
  "halfCostTurns",
  "doubleCostTurns",
  "costReduction",
  "costIncrease",
  "nullifyCostCards",
  "nullifyCostActiveCards",
  "nullifyDebuff",
  "nullifyGenkiTurns",
  "doubleCardEffectCards",
  "noActiveTurns",
  "noMentalTurns",
  "poorConditionTurns",
  "uneaseTurns",
  "scoreBuffs",
  "scoreDebuffs",
  "goodImpressionTurnsBuffs",
  "goodImpressionTurnsEffectBuffs",
  "goodImpressionTurnsTimesBuffs",
  "concentrationBuffs",
  "concentrationEffectBuffs",
  "goodConditionTurns",
  "goodConditionTurnsMultiplier",
  "goodConditionTurnsBuffs",
  "perfectConditionTurns",
  "concentration",
  "concentrationMultiplier",
  "goodImpressionTurns",
  "motivation",
  "motivationMultiplier",
  "motivationBuffs",
  "scoreTimes",
  "prideTurns",
  "stance",
  "prevStance",
  "lockStanceTurns",
  "fullPowerCharge",
  "fullPowerChargeBuffs",
  "cumulativeFullPowerCharge",
  "enthusiasm",
  "enthusiasmBonus",
  "enthusiasmBuffs",
  "strengthTimes",
  "preservationTimes",
  "leisureTimes",
  "fullPowerTimes",
  "stanceChangedByCardTimes",
  "freshBuffs",
  "cardMap",
  "deckCards",
  "handCards",
  "discardedCards",
  "removedCards",
  "heldCards",
  "cardsUsed",
  "activeCardsUsed",
  "turnCardsUsed",
  "turnCardsUpgraded",
  "thisCardHeld",
  "usedCard",
  "lastUsedCard",
  "movedCard",
  "noCardUseTurns",
  "effects",
  "phase",
  "parentPhase",
  "effectInstanceId",
  "effectCounters",
  "currentEffectInstanceId",
  "nullifySelect",
  "freeCardUses",
  "goodImpressionTurnsDelta",
  "motivationDelta",
  "genkiDelta",
  "goodConditionTurnsDelta",
  "concentrationDelta",
  "staminaDelta",
]);

// Intermediate-resolver fields. Legal as assignment LHS even though they
// don't exist directly on state (Executor reroutes them).
export const INTERMEDIATE_FIELDS = new Set([
  "cost",
  "fixedGenki",
  "fixedStamina",
  "effectCounter",
]);

// Growth fields — legal on LHS in growth columns.
export const GROWTH_FIELDS = new Set([
  "g.score",
  "g.scoreTimes",
  "g.cost",
  "g.typedCost",
  "g.genki",
  "g.goodConditionTurns",
  "g.perfectConditionTurns",
  "g.concentration",
  "g.goodImpressionTurns",
  "g.motivation",
  "g.fullPowerCharge",
  "g.halfCostTurns",
  "g.scoreByGoodImpressionTurns",
  "g.scoreByMotivation",
  "g.scoreByGenki",
  "g.stanceLevel",
]);

// Introspect the real engine components so the schema stays in lockstep.
// Stub engine supplies just the fields constructors touch (logger, plus
// the manager refs that Evaluator merges variableResolvers from).
function introspectEngine() {
  const stubEngine = { logger: {} };
  stubEngine.turnManager = new TurnManager(stubEngine);
  stubEngine.cardManager = new CardManager(stubEngine);
  stubEngine.buffManager = new BuffManager(stubEngine);
  const evaluator = new Evaluator(stubEngine);
  return {
    variableResolvers: Object.keys(evaluator.variableResolvers),
    specialActions: [
      ...Object.keys(stubEngine.cardManager.specialActions),
      ...Object.keys(stubEngine.buffManager.specialActions),
    ],
  };
}

const { variableResolvers, specialActions } = introspectEngine();

// Value-producing function calls / identifiers available in condition or
// expression position (not actions). Union of variableResolvers from every
// engine component.
export const VARIABLE_RESOLVERS = new Set(variableResolvers);

// Action names (identifier form or call form) — all names in any
// specialActions map on an engine component.
export const SPECIAL_ACTIONS = new Set(specialActions);

// Stance names (valid identifiers resolved to string stance).
export const STANCES = new Set([
  "none",
  "strength",
  "strength2",
  "preservation",
  "preservation2",
  "leisure",
  "fullPower",
]);

// SOURCE_TYPES / RARITIES / SKILL_CARD_TYPES — legal identifiers in
// comparisons like `cardSourceType == pIdol`.
export const SOURCE_TYPES = new Set(["default", "produce", "pIdol", "support"]);
export const RARITIES = new Set(["N", "R", "SR", "SSR", "T", "L"]);
export const SKILL_CARD_TYPES = new Set(["active", "mental", "trouble"]);

// Turn types (compared against isVocalTurn etc. — but also referenced as
// literals in some data).
export const TURN_TYPES = new Set(["vocal", "dance", "visual"]);

// Target-expression identifiers (appear inside `target:` / `[...]`).
export const TARGET_IDENTIFIERS = new Set([
  "this",
  "hand",
  "deck",
  "discarded",
  "held",
  "removed",
  "all",
  "active",
  "mental",
  "trouble",
  "basic",
  "pIdol",
  "T",
  "N",
  "R",
  "SR",
  "SSR",
  "L",
]);

// Target-expression function calls (appear inside `target:` / `[...]`).
export const TARGET_FUNCTIONS = new Set(["effect", "baseId", "id"]);

// Filter identifiers on `at:phase[...]` phase filters — reuse target ids.
// (The engine evaluates phase filters via getTargetRuleCards.)

// AST modifier names parseable by the parser.
export const MODIFIERS = new Set([
  "limit",
  "ttl",
  "delay",
  "group",
  "line",
  "level",
]);
