import {
  ADDITIVE_OPERATORS,
  BOOLEAN_OPERATORS,
  MULTIPLICATIVE_OPERATORS,
  NUMBER_REGEX,
  PHASES,
  SET_OPERATOR,
  SKILL_CARD_TYPES,
  STANCES,
  S,
  SOURCE_TYPES,
  RARITIES,
  FUNCTION_CALL_REGEX,
} from "../constants.js";
import EngineComponent from "./EngineComponent.js";

export default class Evaluator extends EngineComponent {
  static expressionCache = new Map();

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

  evaluateCondition(state, condition) {
    const fn = this.compile(condition);
    const result = fn(this, state);
    this.logger.debug("Condition", condition, result);
    return result;
  }

  evaluateExpression(state, tokens) {
    return this.compile(tokens)(this, state);
  }

  compile(tokens) {
    const key = JSON.stringify(tokens);
    if (Evaluator.expressionCache.has(key)) {
      return Evaluator.expressionCache.get(key);
    }

    const fn = this._buildFunction(tokens);
    Evaluator.expressionCache.set(key, fn);
    return fn;
  }

  _buildFunction(tokens) {
    // Single tokens
    if (tokens.length == 1) {
      const t = tokens[0];

      // State variables
      if (t in S) {
        return (ctx, state) => {
          if (S[t] in state) return state[S[t]];
          return undefined; // Or throw? Original didn't throw explicitly, just didn't match.
          // Original: if (S[t] in state) return state[S[t]]
          // If not in state, it continued to next checks.
          // Since we compile, we must know WHAT it is.
          // But 't' is mixed. It could be a number string "10".
          // So we must check match priorities at compile time.
        };
      }

      // Since tokens are static, we can check Type at compile time!
      // This eliminates runtime checks.

      // 1. State variables (Check S[t] existence is enough? "goodCondition" is in S)
      // Note: Original code checked `S[t] in state`. State is dynamic.
      // But S[t] keys are static strings. If S[t] exists, it's a candidate state var.
      // Is it possible a token is in S but NOT in state?
      // S maps TokenName -> StateKey.
      // e.g. S.good_condition -> "goodCondition".
      // If "goodCondition" is missing from state, original returned undefined (by skipping return).
      // We'll mimic this: if (t in S) return (ctx, s) => s[S[t]];

      if (t in S) {
        return (ctx, state) => state[S[t]];
      }

      // 2. Function calls
      const match = typeof t === 'string' ? t.match(FUNCTION_CALL_REGEX) : null;
      if (match && match[1] && match[2]) {
        const args = match[2].split(",");
        // Optimization: resolve resolver at compile time?
        // match[1] is name.
        // `this.variableResolvers` is instance specific.
        // We must check at runtime if we trust `variableResolvers` changes.
        // But `variableResolvers` keys are likely static.
        // Let's keep runtime lookup for safety.
        return (ctx, state) => {
          if (ctx.variableResolvers[match[1]]) {
            return ctx.variableResolvers[match[1]](state, ...args);
          }
        };
      }

      // 3. Variable resolvers
      // We don't know if t is in variableResolvers at compile time technically (instance property),
      // but we can assume it's valid if it looks like a resolver name.
      // For compiled code, we return a function that tries to find it.
      // IF we want to be strict order:
      // Original: checked in order.
      // We can return a function that checks in order? No that defeats optimization.
      // We should check "Is it a number?", "Is it a stance?" at compile time.

      if (STANCES.includes(t)) return () => t;
      if (PHASES.includes(t)) return () => t;
      if (SOURCE_TYPES.includes(t)) return () => t;
      if (RARITIES.includes(t)) return () => t;
      if (SKILL_CARD_TYPES.includes(t)) return () => t;

      if (NUMBER_REGEX.test(t)) {
        const val = parseFloat(t);
        return () => val;
      }

      // Fallback for Variable Resolvers (dynamic) or Invalid
      return (ctx, state) => {
        if (ctx.variableResolvers[t]) {
          return ctx.variableResolvers[t](state);
        }
        console.warn(`Invalid token: ${t}`);
      };
    }

    // Set contains
    if (tokens[1] == SET_OPERATOR) {
      if (tokens.length != 3) {
        console.warn("Invalid set contains");
      }
      const lhs = this.compile([tokens[0]]);
      const val = tokens[2];
      return (ctx, state) => {
        const l = lhs(ctx, state);
        return l && l.has ? l.has(val) : false;
      };
    }

    // Comparators
    const cmpIndex = tokens.findIndex((t) => BOOLEAN_OPERATORS.includes(t));
    if (cmpIndex != -1) {
      const lhs = this.compile(tokens.slice(0, cmpIndex));
      const rhs = this.compile(tokens.slice(cmpIndex + 1));
      const op = tokens[cmpIndex];

      switch (op) {
        case ">=": return (c, s) => lhs(c, s) >= rhs(c, s);
        case "==": return (c, s) => lhs(c, s) == rhs(c, s);
        case "<=": return (c, s) => lhs(c, s) <= rhs(c, s);
        case "!=": return (c, s) => lhs(c, s) != rhs(c, s);
        case ">": return (c, s) => lhs(c, s) > rhs(c, s);
        case "<": return (c, s) => lhs(c, s) < rhs(c, s);
        default: console.warn(`Unrecognized comparator: ${op}`); return () => false;
      }
    }

    // Addition, subtraction
    const asIndex = tokens.findIndex((t) => ADDITIVE_OPERATORS.includes(t));
    if (asIndex != -1) {
      const lhs = this.compile(tokens.slice(0, asIndex));
      const rhs = this.compile(tokens.slice(asIndex + 1));
      const op = tokens[asIndex];
      switch (op) {
        case "+": return (c, s) => lhs(c, s) + rhs(c, s);
        case "-": return (c, s) => lhs(c, s) - rhs(c, s);
        default: console.warn(`Unrecognized operator: ${op}`); return () => 0;
      }
    }

    // Multiplication, division, modulo
    const mdIndex = tokens.findIndex((t) => MULTIPLICATIVE_OPERATORS.includes(t));
    if (mdIndex != -1) {
      const lhs = this.compile(tokens.slice(0, mdIndex));
      const rhs = this.compile(tokens.slice(mdIndex + 1));
      const op = tokens[mdIndex];
      switch (op) {
        case "*": return (c, s) => lhs(c, s) * rhs(c, s);
        case "/": return (c, s) => lhs(c, s) / rhs(c, s);
        case "%": return (c, s) => lhs(c, s) % rhs(c, s);
        default: console.warn(`Unrecognized operator: ${op}`); return () => 0;
      }
    }

    return () => undefined;
  }
}
