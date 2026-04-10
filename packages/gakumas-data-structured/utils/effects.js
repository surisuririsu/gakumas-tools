import { parseEffects } from "./parser";
import { transformEffects, serializeExpr, serializeEffect } from "./transformer";

// Re-export serialization functions
export { serializeExpr, serializeEffect };

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
