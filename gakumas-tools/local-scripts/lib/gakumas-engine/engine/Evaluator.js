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
    const tokens = condition;
    const result = this.evaluateExpression(state, tokens);
    this.logger.debug("Condition", condition, result);
    return result;
  }

  evaluateExpression(state, tokens) {
    const evaluate = (tokens) => {
      // Single tokens
      if (tokens.length == 1) {
        // State variables
        if (tokens[0] in S && S[tokens[0]] in state) {
          return state[S[tokens[0]]];
        }

        // Function calls
        const match = tokens[0].match(FUNCTION_CALL_REGEX);
        if (match[1] in this.variableResolvers && match[2]) {
          const args = match[2].split(",");
          return this.variableResolvers[match[1]](state, ...args);
        }

        // Variable resolvers
        if (tokens[0] in this.variableResolvers) {
          return this.variableResolvers[tokens[0]](state);
        }

        // Stances
        if (STANCES.includes(tokens[0])) {
          return tokens[0];
        }

        // Phases
        if (PHASES.includes(tokens[0])) {
          return tokens[0];
        }

        // Source types
        if (SOURCE_TYPES.includes(tokens[0])) {
          return tokens[0];
        }

        // Rarities
        if (RARITIES.includes(tokens[0])) {
          return tokens[0];
        }

        // Skill card types
        if (SKILL_CARD_TYPES.includes(tokens[0])) {
          return tokens[0];
        }

        // Numeric constants
        if (NUMBER_REGEX.test(tokens[0])) {
          return parseFloat(tokens[0]);
        }

        console.warn(`Invalid token: ${tokens[0]}`);
      }

      // Set contains
      if (tokens[1] == SET_OPERATOR) {
        if (tokens.length != 3) {
          console.warn("Invalid set contains");
        }
        const lhs = evaluate([tokens[0]]);
        return lhs.has(tokens[2]);
      }

      // Comparators (boolean operators)
      const cmpIndex = tokens.findIndex((t) => BOOLEAN_OPERATORS.includes(t));
      if (cmpIndex != -1) {
        const lhs = evaluate(tokens.slice(0, cmpIndex));
        const cmp = tokens[cmpIndex];
        const rhs = evaluate(tokens.slice(cmpIndex + 1));

        if (cmp == ">=") {
          return lhs >= rhs;
        } else if (cmp == "==") {
          return lhs == rhs;
        } else if (cmp == "<=") {
          return lhs <= rhs;
        } else if (cmp == "!=") {
          return lhs != rhs;
        } else if (cmp == ">") {
          return lhs > rhs;
        } else if (cmp == "<") {
          return lhs < rhs;
        }
        console.warn(`Unrecognized comparator: ${cmp}`);
      }

      // Addition, subtraction
      const asIndex = tokens.findIndex((t) => ADDITIVE_OPERATORS.includes(t));
      if (asIndex != -1) {
        const lhs = evaluate(tokens.slice(0, asIndex));
        const op = tokens[asIndex];
        const rhs = evaluate(tokens.slice(asIndex + 1));

        if (op == "+") {
          return lhs + rhs;
        } else if (op == "-") {
          return lhs - rhs;
        }
        console.warn(`Unrecognized operator: ${op}`);
      }

      // Multiplication, division, modulo
      const mdIndex = tokens.findIndex((t) =>
        MULTIPLICATIVE_OPERATORS.includes(t)
      );
      if (mdIndex != -1) {
        const lhs = evaluate(tokens.slice(0, mdIndex));
        const op = tokens[mdIndex];
        const rhs = evaluate(tokens.slice(mdIndex + 1));

        if (op == "*") {
          return lhs * rhs;
        } else if (op == "/") {
          return lhs / rhs;
        } else if (op == "%") {
          return lhs % rhs;
        }
        console.warn(`Unrecognized operator: ${op}`);
      }
    };

    return evaluate(tokens);
  }
}
