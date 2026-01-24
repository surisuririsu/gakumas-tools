import { parseEffects } from "./parser";
import { transformEffects, serializeExpr } from "./transformer";

/**
 * Serialize an effect to the new string format
 */
export function serializeEffect(effect, indent = 0) {
  const pad = "  ".repeat(indent);
  const parts = [];

  if (effect.phase) {
    parts.push(`at:${effect.phase} {`);
  }

  const innerPad = effect.phase ? pad + "  " : pad;
  const innerParts = [];

  // Conditions
  if (effect.conditions && effect.conditions.length > 0) {
    const condStrs = effect.conditions.map((c) => serializeExpr(c));
    innerParts.push(`if:${condStrs.join(" & ")} {`);
  }

  const actionPad = effect.conditions?.length ? innerPad + "  " : innerPad;

  // Targets
  if (effect.targets && effect.targets.length > 0) {
    for (const target of effect.targets) {
      const targetStr =
        typeof target === "string"
          ? target
          : `${target.name}(${target.args.join(",")})`;
      innerParts.push(`${actionPad}target:${targetStr} {`);
    }
  }

  const finalPad = effect.targets?.length
    ? actionPad + "  ".repeat(effect.targets.length)
    : actionPad;

  // Actions
  if (effect.actions) {
    for (const action of effect.actions) {
      innerParts.push(`${finalPad}do:${serializeExpr(action)}`);
    }
  }

  // Nested effects
  if (effect.effects) {
    for (const nested of effect.effects) {
      innerParts.push(serializeEffect(nested, indent + 1));
    }
  }

  // Close targets
  if (effect.targets?.length) {
    for (let i = effect.targets.length - 1; i >= 0; i--) {
      innerParts.push(`${actionPad + "  ".repeat(i)}}`);
    }
  }

  // Modifiers
  if (effect.limit != null) innerParts.push(`${actionPad}limit:${effect.limit}`);
  if (effect.ttl != null) innerParts.push(`${actionPad}ttl:${effect.ttl}`);
  if (effect.delay != null) innerParts.push(`${actionPad}delay:${effect.delay}`);
  if (effect.group != null) innerParts.push(`${actionPad}group:${effect.group}`);
  if (effect.line != null) innerParts.push(`${actionPad}line:${effect.line}`);
  if (effect.level != null) innerParts.push(`${actionPad}level:${effect.level}`);

  // Close condition
  if (effect.conditions?.length) {
    innerParts.push(`${innerPad}}`);
  }

  if (innerParts.length) {
    parts.push(...innerParts.map((p) => (effect.phase ? innerPad + p : p)));
  }

  // Close phase
  if (effect.phase) {
    parts.push(`${pad}}`);
  }

  return parts.join("\n");
}

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

