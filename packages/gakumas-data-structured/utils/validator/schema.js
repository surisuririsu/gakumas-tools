/**
 * Validator schema.
 *
 * Hand-maintained whitelists of every identifier/function/phase/field the
 * structured engine understands. The validator walks parsed ASTs and flags
 * any name not in these sets — catches migration typos and DSL drift at
 * data-build time instead of during silent test divergence.
 *
 * If you rename something in the engine, update the matching list here.
 */

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

// Value-producing function calls / identifiers available in condition or
// expression position (not actions). Union of variableResolvers from every
// engine component.
export const VARIABLE_RESOLVERS = new Set([
  // Evaluator
  "maxStamina",
  "clearRatio",
  "effectCounter",
  // TurnManager
  "isVocalTurn",
  "isDanceTurn",
  "isVisualTurn",
  // CardManager
  "cardHasEffect",
  "cardSourceType",
  "cardRarity",
  "usedCardId",
  "usedCardBaseId",
  "lastUsedCardType",
  "movedCardId",
  "countCards",
  // BuffManager
  "isPreservation",
  "isStrength",
  "isFullPower",
  "isDirectEffect",
  "stanceChangedTimes",
  "goodImpressionTurnsEffectBuff",
]);

// Buff-type action names generated from BUFF_TYPES in BuffManager.
const BUFF_ACTIONS = [
  "setScoreBuff",
  "setScoreDebuff",
  "setGoodImpressionTurnsBuff",
  "setGoodImpressionTurnsEffectBuff",
  "setGoodImpressionTurnsTimesBuff",
  "setMotivationBuff",
  "setGoodConditionTurnsBuff",
  "setConcentrationBuff",
  "setConcentrationEffectBuff",
  "setEnthusiasmBuff",
  "setFullPowerChargeBuff",
];

// Action names (identifier form or call form) — all names in any
// specialActions map on an engine component.
export const SPECIAL_ACTIONS = new Set([
  // CardManager
  "drawCard",
  "upgradeHand",
  "exchangeHand",
  "upgradeRandomCardInHand",
  "addRandomUpgradedCardToHand",
  "addRandomUpgradedSSRCardToHand",
  "addCardToTopOfDeck",
  "addCardToDeck",
  "addCardToHand",
  "moveCardToTopOfDeck",
  "moveCardToHand",
  "moveCardToHandFromDeckOrDiscards",
  "moveCardToHandFromRemoved",
  "moveSelectedToHand",
  "holdCard",
  "holdThisCard",
  "holdSelected",
  "moveHeldCardsToHand",
  "useRandomCardFree",
  "useAllCardsFree",
  "useSelectedCardFree",
  "moveRandomToHand",
  "moveAllToHand",
  "moveRandomToTopOfDeck",
  "moveAllToTopOfDeck",
  "moveAllToDeck",
  "holdRandom",
  "holdAll",
  "holdThis",
  "useRandomFree",
  "useSelectedFree",
  "useAllFree",
  "removeAll",
  "removeCard",
  "moveToHand",
  "moveToTopOfDeck",
  "moveToDeck",
  // BuffManager
  "removeDebuffs",
  "setStance",
  "decreaseFullPowerCharge",
  ...BUFF_ACTIONS,
]);

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
