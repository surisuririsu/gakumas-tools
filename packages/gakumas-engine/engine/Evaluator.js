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

    // Return the identifier name as-is for target rules (e.g., "removed\604", "hand\R")
    // This allows functions like countCards() to receive the target rule string
    return name;
  }

  /**
   * Evaluate a function call
   */
  evaluateCall(state, node) {
    const { name, args } = node;

    if (name in this.variableResolvers) {
      const evaluatedArgs = args.map((arg) => this.evaluateAST(state, arg));
      return this.variableResolvers[name](state, ...evaluatedArgs);
    }

    console.warn(`Unknown function: ${name}`);
    return undefined;
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
