import { parseEffects, parsePatches } from "./parser";
import {
  transformEffects,
  transformPatches,
  serializeExpr,
  serializeEffect,
  serializePatches,
} from "./transformer";

// Re-export serialization functions
export { serializeExpr, serializeEffect, serializePatches };

/**
 * Serialize an effect sequence to string
 */
export function serializeEffectSequence(effectSequence) {
  return effectSequence.map((e) => serializeEffect(e)).join(";\n");
}

/**
 * Deserialize an effect string to the engine format
 */
export function deserializeEffectSequence(effectSequenceString) {
  if (!effectSequenceString?.length) {
    return [];
  }

  try {
    const ast = parseEffects(effectSequenceString);
    return transformEffects(ast);
  } catch (error) {
    console.error("Failed to parse effect:", effectSequenceString);
    console.error(error);
    return [];
  }
}

/**
 * Deserialize a customization patch string into an array of patch records.
 * Each record is {op, anchor?, effect?/delta, level?}.
 */
export function deserializePatchSequence(patchSequenceString) {
  if (!patchSequenceString?.length) {
    return [];
  }

  try {
    const ast = parsePatches(patchSequenceString);
    return transformPatches(ast);
  } catch (error) {
    console.error("Failed to parse patch sequence:", patchSequenceString);
    console.error(error);
    return [];
  }
}
