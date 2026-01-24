/**
 * AST Serialization
 *
 * Converts AST nodes back to effect string format.
 * Used for debugging, display, and effect merging.
 */

/**
 * Get operator precedence (higher = binds tighter)
 */
function getOpPrecedence(op) {
  switch (op) {
    case "|":
      return 1;
    case "&":
      return 2;
    case "+":
    case "-":
      return 3;
    case "*":
    case "/":
    case "%":
      return 4;
    default:
      return 0;
  }
}

/**
 * Serialize an expression AST node back to string
 * @param {Object} node - AST node
 * @param {number} parentPrecedence - Precedence of parent operator (for adding parens)
 */
export function serializeExpr(node, parentPrecedence = 0) {
  if (!node) return "";

  switch (node.type) {
    case "number":
      return String(node.value);

    case "identifier":
      return node.name;

    case "call": {
      let result = node.name;
      if (node.target) {
        result += `[${serializeExpr(node.target, 0)}]`;
      }
      if (node.args && node.args.length > 0) {
        const args = node.args.map((a) => serializeExpr(a, 0)).join(", ");
        result += `(${args})`;
      }
      return result;
    }

    case "binary": {
      const myPrecedence = getOpPrecedence(node.op);
      const left = serializeExpr(node.left, myPrecedence);
      const right = serializeExpr(node.right, myPrecedence + 0.5);
      const result = `${left} ${node.op} ${right}`;
      if (parentPrecedence > myPrecedence) {
        return `(${result})`;
      }
      return result;
    }

    case "unary":
      return `${node.op}${serializeExpr(node.operand, 10)}`;

    case "comparison":
      return `${serializeExpr(node.left, 0)}${node.op}${serializeExpr(node.right, 0)}`;

    case "assignment":
      return `${node.lhs}${node.op}${serializeExpr(node.rhs, 0)}`;

    default:
      console.warn("Unknown node type in serialization:", node.type);
      return String(node);
  }
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
        result += `${pad}  target:${serializeExpr(target)} {\n`;
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
    if (effect.line != null) result += `${innerPad}line:${effect.line}\n`;
    if (effect.level != null) result += `${innerPad}level:${effect.level}\n`;

    // Close condition
    if (effect.conditions && effect.conditions.length > 0) {
      result += `${pad}  }\n`;
    }

    result += `${pad}}\n`;
  }

  return result;
}
