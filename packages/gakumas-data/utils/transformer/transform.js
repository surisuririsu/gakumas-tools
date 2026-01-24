/**
 * AST to Engine Format Transformer
 *
 * Transforms the AST from the parser into the flattened effect structure
 * that the engine expects.
 *
 * Input (AST):
 * {
 *   type: 'sequence',
 *   effects: [
 *     {
 *       type: 'phase',
 *       phase: 'startOfTurn',
 *       body: [
 *         { type: 'condition', expr: {...}, body: [...] },
 *         { type: 'action', expr: {...} },
 *         { type: 'limit', value: 1 }
 *       ]
 *     }
 *   ]
 * }
 *
 * Output (Engine format):
 * [
 *   {
 *     phase: 'startOfTurn',
 *     conditions: [conditionAST],
 *     actions: [actionAST],
 *     limit: 1,
 *     ttl: null,
 *     delay: null,
 *     group: 0,
 *     targets: null,
 *     effects: null
 *   }
 * ]
 */

const MODIFIER_TYPES = ["limit", "ttl", "delay", "group", "line", "level"];

function isModifier(node) {
  return MODIFIER_TYPES.includes(node.type);
}

/**
 * Transform an AST into the engine's effect format
 * @param {Object} ast - The parsed AST
 * @returns {Array} Array of effect objects for the engine
 */
export function transformEffects(ast) {
  if (ast.type !== "sequence") {
    throw new Error("Expected sequence at top level");
  }

  const results = [];
  let pendingActions = [];
  let pendingModifiers = {};

  for (const node of ast.effects) {
    if (isModifier(node)) {
      pendingModifiers[node.type] = node.value;
    } else if (node.type === "action") {
      // If we have pending modifiers but no pending actions, apply to last result
      if (
        Object.keys(pendingModifiers).length > 0 &&
        pendingActions.length === 0 &&
        results.length > 0
      ) {
        Object.assign(results[results.length - 1], pendingModifiers);
        pendingModifiers = {};
      }
      pendingActions.push(node.expr);
    } else {
      // Flush pending actions/modifiers before processing blocks
      if (pendingActions.length > 0) {
        const effect = { actions: pendingActions };
        Object.assign(effect, pendingModifiers);
        results.push(effect);
        pendingActions = [];
        pendingModifiers = {};
      } else if (Object.keys(pendingModifiers).length > 0 && results.length > 0) {
        Object.assign(results[results.length - 1], pendingModifiers);
        pendingModifiers = {};
      }

      // Transform the block normally
      const transformed = transformNode(node, {});
      results.push(...transformed);
    }
  }

  // Flush any remaining actions/modifiers
  if (pendingActions.length > 0) {
    const effect = { actions: pendingActions };
    Object.assign(effect, pendingModifiers);
    results.push(effect);
  } else if (Object.keys(pendingModifiers).length > 0 && results.length > 0) {
    Object.assign(results[results.length - 1], pendingModifiers);
  }

  return results;
}

/**
 * Transform a single AST node, inheriting context from parents
 */
function transformNode(node, context) {
  switch (node.type) {
    case "phase":
      return transformPhaseBlock(node, context);
    case "condition":
      return transformConditionBlock(node, context);
    case "target":
      return transformTargetBlock(node, context);
    case "action":
      return transformAction(node, context);
    default:
      if (isModifier(node)) {
        return [{ _pending: { [node.type]: node.value } }];
      }
      throw new Error(`Unknown node type: ${node.type}`);
  }
}

function transformPhaseBlock(node, context) {
  return transformBody(node.body, { ...context, phase: node.phase });
}

function transformConditionBlock(node, context) {
  const conditions = context.conditions ? [...context.conditions] : [];
  conditions.push(node.expr);
  return transformBody(node.body, { ...context, conditions });
}

function transformTargetBlock(node, context) {
  const targets = context.targets ? [...context.targets] : [];
  targets.push(node.target);
  return transformBody(node.body, { ...context, targets });
}

function transformAction(node, context) {
  const effect = createEffect(context);
  effect.actions = [node.expr];
  return [effect];
}

/**
 * Transform a body (list of nodes)
 * Collects all actions into a single effect with modifiers
 */
function transformBody(body, context) {
  const results = [];
  let pendingActions = [];
  let pendingModifiers = {};
  let pendingNestedPhases = [];

  for (const node of body) {
    if (isModifier(node)) {
      pendingModifiers[node.type] = node.value;
    } else if (node.type === "phase") {
      // Nested phase blocks become nested effects
      const nestedEffects = transformPhaseBlock(node, {});
      pendingNestedPhases.push(...nestedEffects);
    } else if (node.type === "action") {
      pendingActions.push(node.expr);
    } else if (node.type === "condition" || node.type === "target") {
      // Flush any pending actions before processing nested blocks
      if (pendingActions.length > 0) {
        const effect = createEffect(context);
        effect.actions = pendingActions;
        Object.assign(effect, pendingModifiers);
        if (pendingNestedPhases.length > 0) {
          effect.effects = [...pendingNestedPhases];
          pendingNestedPhases = [];
        }
        results.push(effect);
        pendingActions = [];
        pendingModifiers = {};
      }

      // Recurse into nested blocks
      const nested = transformNode(node, context);

      // Apply pending modifiers and nested phases to nested results
      if (Object.keys(pendingModifiers).length > 0) {
        for (const effect of nested) {
          Object.assign(effect, pendingModifiers);
        }
        pendingModifiers = {};
      }

      if (pendingNestedPhases.length > 0 && nested.length > 0) {
        if (!nested[0].effects) nested[0].effects = [];
        nested[0].effects.push(...pendingNestedPhases);
        pendingNestedPhases = [];
      }

      results.push(...nested);
    }
  }

  // Flush remaining actions
  if (pendingActions.length > 0) {
    const effect = createEffect(context);
    effect.actions = pendingActions;
    Object.assign(effect, pendingModifiers);
    if (pendingNestedPhases.length > 0) {
      effect.effects = [...pendingNestedPhases];
    }
    results.push(effect);
  } else if (results.length === 0) {
    // Empty body - still create effect if we have meaningful context
    const effect = createEffect(context);
    Object.assign(effect, pendingModifiers);
    if (pendingNestedPhases.length > 0) {
      effect.effects = [...pendingNestedPhases];
    }
    if (effect.phase || effect.effects || effect.conditions || effect.targets) {
      results.push(effect);
    }
  } else if (results.length > 0) {
    // Apply orphan modifiers to last result
    if (Object.keys(pendingModifiers).length > 0) {
      Object.assign(results[results.length - 1], pendingModifiers);
    }
    // Apply orphan nested phases to last result
    if (pendingNestedPhases.length > 0) {
      const lastResult = results[results.length - 1];
      if (!lastResult.effects) {
        lastResult.effects = [];
      }
      lastResult.effects.push(...pendingNestedPhases);
    }
  }

  return results;
}

/**
 * Create a new effect object with inherited context
 */
function createEffect(context) {
  const effect = {};

  if (context.phase) {
    effect.phase = context.phase;
  }

  if (context.conditions && context.conditions.length > 0) {
    effect.conditions = [...context.conditions];
  }

  if (context.targets && context.targets.length > 0) {
    effect.targets = [...context.targets];
  }

  return effect;
}
