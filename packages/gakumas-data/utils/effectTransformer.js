/**
 * Effect Transformer
 *
 * Transforms the AST from effectParser.js into the flattened effect structure
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

/**
 * Transform an AST into the engine's effect format
 * @param {Object} ast - The parsed AST
 * @returns {Array} Array of effect objects for the engine
 */
export function transformEffects(ast) {
  if (ast.type !== "sequence") {
    throw new Error("Expected sequence at top level");
  }

  // At the top level, we need to:
  // 1. Transform phase/condition/target blocks normally
  // 2. Merge consecutive actions and modifiers together
  // 3. Apply trailing modifiers to the preceding effect
  const results = [];
  let pendingActions = [];
  let pendingModifiers = {};

  for (const node of ast.effects) {
    if (
      node.type === "limit" ||
      node.type === "ttl" ||
      node.type === "delay" ||
      node.type === "group" ||
      node.type === "line" ||
      node.type === "level"
    ) {
      // Accumulate modifiers
      pendingModifiers[node.type] = node.value;
    } else if (node.type === "action") {
      // If we have pending modifiers but no pending actions, apply to last result
      if (Object.keys(pendingModifiers).length > 0 && pendingActions.length === 0 && results.length > 0) {
        Object.assign(results[results.length - 1], pendingModifiers);
        pendingModifiers = {};
      }
      // Accumulate actions
      pendingActions.push(node.expr);
    } else {
      // Flush pending actions/modifiers before processing blocks
      if (pendingActions.length > 0) {
        const effect = {};
        effect.actions = pendingActions;
        Object.assign(effect, pendingModifiers);
        results.push(effect);
        pendingActions = [];
        pendingModifiers = {};
      } else if (Object.keys(pendingModifiers).length > 0 && results.length > 0) {
        // Apply orphan modifiers to last result
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
    const effect = {};
    effect.actions = pendingActions;
    Object.assign(effect, pendingModifiers);
    results.push(effect);
  } else if (Object.keys(pendingModifiers).length > 0 && results.length > 0) {
    // Apply trailing modifiers to last result
    Object.assign(results[results.length - 1], pendingModifiers);
  }

  return results;
}

/**
 * Transform a single AST node, inheriting context from parents
 * @param {Object} node - AST node
 * @param {Object} context - Inherited context (phase, conditions, etc.)
 * @returns {Array} Array of effect objects
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
    case "limit":
    case "ttl":
    case "delay":
    case "group":
    case "line":
    case "level":
      return transformModifier(node, context);
    default:
      throw new Error(`Unknown node type: ${node.type}`);
  }
}

/**
 * Transform phase block: at:phase { body }
 */
function transformPhaseBlock(node, context) {
  const newContext = {
    ...context,
    phase: node.phase,
  };

  return transformBody(node.body, newContext);
}

/**
 * Transform condition block: if:condition { body }
 */
function transformConditionBlock(node, context) {
  const conditions = context.conditions ? [...context.conditions] : [];
  conditions.push(node.expr);

  const newContext = {
    ...context,
    conditions,
  };

  return transformBody(node.body, newContext);
}

/**
 * Transform target block: target:target { body }
 */
function transformTargetBlock(node, context) {
  const targets = context.targets ? [...context.targets] : [];
  targets.push(node.target);

  const newContext = {
    ...context,
    targets,
  };

  return transformBody(node.body, newContext);
}

/**
 * Transform action: do:expr
 */
function transformAction(node, context) {
  const effect = createEffect(context);
  if (!effect.actions) effect.actions = [];
  effect.actions.push(node.expr);
  return [effect];
}

/**
 * Transform modifier (limit, ttl, delay, group)
 * Modifiers without actions are stored as pending modifiers in context
 */
function transformModifier(node, context) {
  // This creates an effect with just the modifier
  // It will be merged with subsequent actions in the same body
  return [{ _pending: { [node.type]: node.value } }];
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
    if (
      node.type === "limit" ||
      node.type === "ttl" ||
      node.type === "delay" ||
      node.type === "group" ||
      node.type === "line" ||
      node.type === "level"
    ) {
      // Accumulate modifiers
      pendingModifiers[node.type] = node.value;
    } else if (node.type === "phase") {
      // Nested phase blocks become nested effects
      const nestedEffects = transformPhaseBlock(node, {});
      pendingNestedPhases.push(...nestedEffects);
    } else if (node.type === "action") {
      // Collect actions
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
      pendingNestedPhases = [];
    }
    results.push(effect);
  } else if (results.length === 0) {
    // Empty body - still create effect if we have context (phase, conditions, targets)
    // or orphan modifiers/nested phases
    const effect = createEffect(context);
    Object.assign(effect, pendingModifiers);
    if (pendingNestedPhases.length > 0) {
      effect.effects = [...pendingNestedPhases];
    }
    // Push if we have any meaningful content
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

/**
 * Serialize an effect back to the new string format (for debugging/display)
 */
export function serializeEffect(effect, indent = 0) {
  const pad = "  ".repeat(indent);
  let result = "";

  if (effect.phase) {
    result += `${pad}at:${effect.phase} {\n`;

    if (effect.conditions && effect.conditions.length > 0) {
      const condStr = effect.conditions.map(serializeExpr).join(" & ");
      result += `${pad}  if:${condStr} {\n`;
      indent += 2;
    }

    if (effect.targets && effect.targets.length > 0) {
      for (const target of effect.targets) {
        const targetStr =
          typeof target === "string"
            ? target
            : `${target.name}(${target.args.join(",")})`;
        result += `${pad}  target:${targetStr} {\n`;
      }
      indent += effect.targets.length;
    }

    const innerPad = "  ".repeat(indent + 1);

    if (effect.actions) {
      for (const action of effect.actions) {
        result += `${innerPad}do:${serializeExpr(action)}\n`;
      }
    }

    if (effect.effects) {
      for (const nested of effect.effects) {
        result += serializeEffect(nested, indent + 1);
      }
    }

    // Close targets
    if (effect.targets) {
      for (let i = effect.targets.length - 1; i >= 0; i--) {
        result += `${"  ".repeat(indent)}}\n`;
        indent--;
      }
    }

    // Add modifiers
    if (effect.limit != null) result += `${innerPad}limit:${effect.limit}\n`;
    if (effect.ttl != null) result += `${innerPad}ttl:${effect.ttl}\n`;
    if (effect.delay != null) result += `${innerPad}delay:${effect.delay}\n`;
    if (effect.group != null) result += `${innerPad}group:${effect.group}\n`;

    // Close condition
    if (effect.conditions && effect.conditions.length > 0) {
      result += `${pad}  }\n`;
    }

    result += `${pad}}\n`;
  }

  return result;
}

/**
 * Serialize an expression AST node back to string
 */
export function serializeExpr(node) {
  if (!node) return "";

  switch (node.type) {
    case "number":
      return String(node.value);

    case "identifier":
      return node.name;

    case "call": {
      let result = node.name;
      // Add target expression in brackets if present
      if (node.target) {
        result += `[${serializeExpr(node.target)}]`;
      }
      // Add arguments in parentheses if present
      if (node.args && node.args.length > 0) {
        const args = node.args.map(serializeExpr).join(",");
        result += `(${args})`;
      }
      return result;
    }

    case "binary":
      return `${serializeExpr(node.left)}${node.op}${serializeExpr(node.right)}`;

    case "unary":
      return `${node.op}${serializeExpr(node.operand)}`;

    case "comparison":
      return `${serializeExpr(node.left)}${node.op}${serializeExpr(node.right)}`;

    case "assignment":
      return `${node.lhs}${node.op}${serializeExpr(node.rhs)}`;

    default:
      console.warn("Unknown node type in serialization:", node.type);
      return String(node);
  }
}
