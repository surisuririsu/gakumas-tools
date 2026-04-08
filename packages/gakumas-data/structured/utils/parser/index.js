/**
 * Effects Language Parser
 *
 * Parses effect strings into an AST that can be transformed
 * into the engine's effect format.
 *
 * Example:
 *   at:startOfTurn { if:goodConditionTurns>=4 { do:concentration+=4 } limit:1 }
 *
 * See parser.js for the full grammar specification.
 */
import { Tokenizer } from "./tokenizer";
import { Parser } from "./parser";

/**
 * Parse an effect string into an AST
 * @param {string} input - The effect string to parse
 * @returns {Object} The parsed AST
 */
export function parseEffects(input) {
  if (!input || !input.trim()) {
    return { type: "sequence", effects: [] };
  }

  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  return parser.parseEffectSequence();
}
