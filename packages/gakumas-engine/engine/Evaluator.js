import {
  PHASES,
  SKILL_CARD_TYPES,
  STANCES,
  S,
  SOURCE_TYPES,
  RARITIES,
} from "../constants";
import EngineComponent from "./EngineComponent";

export default class Evaluator extends EngineComponent {
  constructor(engine) {
    super(engine);

    this.variableResolvers = {
      maxStamina: (state) => this.getConfig(state).idol.params.stamina,
      clearRatio: () => 0,
      ...this.engine.turnManager.variableResolvers,
      ...this.engine.cardManager.variableResolvers,
      ...this.engine.buffManager.variableResolvers,
    };
  }

  /**
   * Evaluate a condition (AST node)
   */
  evaluateCondition(state, condition) {
    const result = this.evaluateAST(state, condition);
    this.logger.debug("Condition", condition, result);
    return result;
  }

  /**
   * Evaluate an expression (AST node)
   */
  evaluateExpression(state, expr) {
    return this.evaluateAST(state, expr);
  }

  /**
   * Evaluate an AST node
   */
  evaluateAST(state, node) {
    if (!node) {
      console.warn("Null AST node");
      return undefined;
    }

    switch (node.type) {
      case "number":
        return node.value;

      case "identifier":
        return this.resolveIdentifier(state, node.name);

      case "call":
        return this.evaluateCall(state, node);

      case "binary":
        return this.evaluateBinary(state, node);

      case "unary":
        return this.evaluateUnary(state, node);

      case "comparison":
        return this.evaluateComparison(state, node);

      case "assignment":
        // Assignments are handled by Executor, not Evaluator
        // But we may need to evaluate the RHS
        return this.evaluateAST(state, node.rhs);

      default:
        console.warn(`Unknown AST node type: ${node.type}`);
        return undefined;
    }
  }

  /**
   * Resolve an identifier to its value
   */
  resolveIdentifier(state, name) {
    // State variables
    if (name in S && S[name] in state) {
      return state[S[name]];
    }

    // Variable resolvers
    if (name in this.variableResolvers) {
      return this.variableResolvers[name](state);
    }

    // Stances
    if (STANCES.includes(name)) {
      return name;
    }

    // Phases
    if (PHASES.includes(name)) {
      return name;
    }

    // Source types
    if (SOURCE_TYPES.includes(name)) {
      return name;
    }

    // Rarities
    if (RARITIES.includes(name)) {
      return name;
    }

    // Skill card types
    if (SKILL_CARD_TYPES.includes(name)) {
      return name;
    }

    console.warn(`Unknown identifier: ${name}`);
    return undefined;
  }

  /**
   * Evaluate a function call
   */
  evaluateCall(state, node) {
    const { name, args } = node;

    if (name in this.variableResolvers) {
      const evaluatedArgs = args.map((arg) => {
        // Pass target expressions as AST nodes (don't evaluate)
        if (this.isTargetExpression(arg)) {
          return arg;
        }
        if (arg.type === "identifier") {
          return arg.name;
        }
        return this.evaluateAST(state, arg);
      });
      return this.variableResolvers[name](state, ...evaluatedArgs);
    }

    console.warn(`Unknown function: ${name}`);
    return undefined;
  }

  // Check if an AST node is a target expression (uses &, |, ! operators)
  isTargetExpression(node) {
    if (!node || typeof node !== "object") return false;

    if (node.type === "binary" && ["&", "|"].includes(node.op)) {
      return true;
    }
    if (node.type === "unary" && node.op === "!") {
      return true;
    }
    if (node.type === "call") {
      // Function calls in target context (like effect(preservation))
      return true;
    }

    // Check children recursively
    if (node.type === "binary") {
      return this.isTargetExpression(node.left) || this.isTargetExpression(node.right);
    }
    if (node.type === "unary") {
      return this.isTargetExpression(node.operand);
    }

    return false;
  }

  /**
   * Evaluate a binary operation
   */
  evaluateBinary(state, node) {
    const { op, left, right } = node;

    // Short-circuit evaluation for logical operators
    if (op === "|") {
      const leftVal = this.evaluateAST(state, left);
      if (leftVal) return true;
      return !!this.evaluateAST(state, right);
    }

    if (op === "&") {
      const leftVal = this.evaluateAST(state, left);
      // If left is a Set, treat & as set membership (backward compat with old format)
      if (leftVal && leftVal.has) {
        // Right side should be an identifier name for set membership
        const element = right.type === "identifier" ? right.name : this.evaluateAST(state, right);
        return leftVal.has(element);
      }
      // Otherwise treat as boolean AND
      if (!leftVal) return false;
      return !!this.evaluateAST(state, right);
    }

    // Evaluate both sides for arithmetic operators
    const leftVal = this.evaluateAST(state, left);
    const rightVal = this.evaluateAST(state, right);

    switch (op) {
      case "+":
        return leftVal + rightVal;
      case "-":
        return leftVal - rightVal;
      case "*":
        return leftVal * rightVal;
      case "/":
        return leftVal / rightVal;
      case "%":
        return leftVal % rightVal;
      default:
        console.warn(`Unknown binary operator: ${op}`);
        return undefined;
    }
  }

  /**
   * Evaluate a unary operation
   */
  evaluateUnary(state, node) {
    const { op, operand } = node;
    const val = this.evaluateAST(state, operand);

    switch (op) {
      case "!":
        return !val;
      case "-":
        return -val;
      default:
        console.warn(`Unknown unary operator: ${op}`);
        return undefined;
    }
  }

  /**
   * Evaluate a comparison
   */
  evaluateComparison(state, node) {
    const { op, left, right } = node;
    const leftVal = this.evaluateAST(state, left);
    const rightVal = this.evaluateAST(state, right);

    switch (op) {
      case "==":
        return leftVal == rightVal;
      case "!=":
        return leftVal != rightVal;
      case "<":
        return leftVal < rightVal;
      case ">":
        return leftVal > rightVal;
      case "<=":
        return leftVal <= rightVal;
      case ">=":
        return leftVal >= rightVal;
      default:
        console.warn(`Unknown comparison operator: ${op}`);
        return undefined;
    }
  }
}
