/**
 * Effects Language Parser
 *
 * Grammar (EBNF):
 *
 * effectSequence = effect (";" effect)*
 * effect = phaseBlock | conditionBlock | targetBlock | action | modifier
 * phaseBlock = "at:" phase "{" effectBody "}"
 * effectBody = (conditionBlock | targetBlock | phaseBlock | action | modifier)*
 * conditionBlock = "if:" condition "{" effectBody "}"
 * targetBlock = "target:" targetExpr "{" effectBody "}"
 * action = "do:" assignmentExpr
 * modifier = "limit:" number | "ttl:" number | "delay:" number | "group:" number | "line:" number | "level:" number
 *
 * condition = orExpr
 * orExpr = andExpr ("|" andExpr)*
 * andExpr = unaryExpr ("&" unaryExpr)*
 * unaryExpr = "!" unaryExpr | comparisonExpr
 * comparisonExpr = addExpr (("==" | "!=" | "<" | ">" | "<=" | ">=") addExpr)?
 *
 * assignmentExpr = identifier assignmentOp expression | specialAction
 * assignmentOp = "=" | "+=" | "-=" | "*=" | "/=" | "%="
 *
 * expression = addExpr
 * addExpr = mulExpr (("+" | "-") mulExpr)*
 * mulExpr = unaryMath (("*" | "/" | "%") unaryMath)*
 * unaryMath = "-" unaryMath | primaryExpr
 * primaryExpr = "(" expression ")" | functionCall | number | identifier
 * functionCall = identifier "(" (expression ("," expression)*)? ")"
 */

// Token types
const TokenType = {
  // Keywords
  AT: "AT",
  IF: "IF",
  DO: "DO",
  TARGET: "TARGET",
  LIMIT: "LIMIT",
  TTL: "TTL",
  DELAY: "DELAY",
  GROUP: "GROUP",
  LINE: "LINE",
  LEVEL: "LEVEL",

  // Delimiters
  LBRACE: "LBRACE",
  RBRACE: "RBRACE",
  LPAREN: "LPAREN",
  RPAREN: "RPAREN",
  SEMICOLON: "SEMICOLON",
  COLON: "COLON",
  COMMA: "COMMA",

  // Operators
  EQ: "EQ", // ==
  NE: "NE", // !=
  LT: "LT", // <
  GT: "GT", // >
  LE: "LE", // <=
  GE: "GE", // >=
  ASSIGN: "ASSIGN", // =
  PLUS_ASSIGN: "PLUS_ASSIGN", // +=
  MINUS_ASSIGN: "MINUS_ASSIGN", // -=
  MUL_ASSIGN: "MUL_ASSIGN", // *=
  DIV_ASSIGN: "DIV_ASSIGN", // /=
  MOD_ASSIGN: "MOD_ASSIGN", // %=
  PLUS: "PLUS", // +
  MINUS: "MINUS", // -
  MUL: "MUL", // *
  DIV: "DIV", // /
  MOD: "MOD", // %
  AND: "AND", // &
  OR: "OR", // |
  NOT: "NOT", // !

  // Literals
  NUMBER: "NUMBER",
  IDENTIFIER: "IDENTIFIER",

  // Special
  EOF: "EOF",
};

// Keywords map
const KEYWORDS = {
  at: TokenType.AT,
  if: TokenType.IF,
  do: TokenType.DO,
  target: TokenType.TARGET,
  limit: TokenType.LIMIT,
  ttl: TokenType.TTL,
  delay: TokenType.DELAY,
  group: TokenType.GROUP,
  line: TokenType.LINE,
  level: TokenType.LEVEL,
};

/**
 * Tokenizer - converts effect string to tokens
 */
class Tokenizer {
  constructor(input) {
    this.input = input;
    this.pos = 0;
    this.line = 1;
    this.col = 1;
  }

  peek(offset = 0) {
    return this.input[this.pos + offset];
  }

  advance() {
    const char = this.input[this.pos++];
    if (char === "\n") {
      this.line++;
      this.col = 1;
    } else {
      this.col++;
    }
    return char;
  }

  skipWhitespace() {
    while (this.pos < this.input.length && /\s/.test(this.peek())) {
      this.advance();
    }
  }

  makeToken(type, value = null) {
    return { type, value, line: this.line, col: this.col };
  }

  readNumber() {
    const startCol = this.col;
    let num = "";
    let hasDecimal = false;

    if (this.peek() === "-") {
      num += this.advance();
    }

    while (this.pos < this.input.length) {
      const char = this.peek();
      if (/\d/.test(char)) {
        num += this.advance();
      } else if (char === "." && !hasDecimal) {
        hasDecimal = true;
        num += this.advance();
      } else {
        break;
      }
    }

    return {
      type: TokenType.NUMBER,
      value: parseFloat(num),
      line: this.line,
      col: startCol,
    };
  }

  readIdentifier() {
    const startCol = this.col;
    let id = "";

    while (this.pos < this.input.length) {
      const char = this.peek();
      // Include backslash for patterns like hand\R, removed\604
      if (/[a-zA-Z0-9_.\\]/.test(char)) {
        id += this.advance();
      } else {
        break;
      }
    }

    // Check if it's a keyword
    const keyword = KEYWORDS[id.toLowerCase()];
    if (keyword) {
      return { type: keyword, value: id, line: this.line, col: startCol };
    }

    return {
      type: TokenType.IDENTIFIER,
      value: id,
      line: this.line,
      col: startCol,
    };
  }

  nextToken() {
    this.skipWhitespace();

    if (this.pos >= this.input.length) {
      return this.makeToken(TokenType.EOF);
    }

    const char = this.peek();
    const startCol = this.col;

    // Single character tokens
    switch (char) {
      case "{":
        this.advance();
        return { type: TokenType.LBRACE, line: this.line, col: startCol };
      case "}":
        this.advance();
        return { type: TokenType.RBRACE, line: this.line, col: startCol };
      case "(":
        this.advance();
        return { type: TokenType.LPAREN, line: this.line, col: startCol };
      case ")":
        this.advance();
        return { type: TokenType.RPAREN, line: this.line, col: startCol };
      case ";":
        this.advance();
        return { type: TokenType.SEMICOLON, line: this.line, col: startCol };
      case ":":
        this.advance();
        return { type: TokenType.COLON, line: this.line, col: startCol };
      case ",":
        this.advance();
        return { type: TokenType.COMMA, line: this.line, col: startCol };
      case "&":
        this.advance();
        return { type: TokenType.AND, line: this.line, col: startCol };
      case "|":
        this.advance();
        return { type: TokenType.OR, line: this.line, col: startCol };
    }

    // Two-character operators
    if (char === "=" && this.peek(1) === "=") {
      this.advance();
      this.advance();
      return { type: TokenType.EQ, line: this.line, col: startCol };
    }
    if (char === "!" && this.peek(1) === "=") {
      this.advance();
      this.advance();
      return { type: TokenType.NE, line: this.line, col: startCol };
    }
    if (char === "<" && this.peek(1) === "=") {
      this.advance();
      this.advance();
      return { type: TokenType.LE, line: this.line, col: startCol };
    }
    if (char === ">" && this.peek(1) === "=") {
      this.advance();
      this.advance();
      return { type: TokenType.GE, line: this.line, col: startCol };
    }
    if (char === "+" && this.peek(1) === "=") {
      this.advance();
      this.advance();
      return { type: TokenType.PLUS_ASSIGN, line: this.line, col: startCol };
    }
    if (char === "-" && this.peek(1) === "=") {
      this.advance();
      this.advance();
      return { type: TokenType.MINUS_ASSIGN, line: this.line, col: startCol };
    }
    if (char === "*" && this.peek(1) === "=") {
      this.advance();
      this.advance();
      return { type: TokenType.MUL_ASSIGN, line: this.line, col: startCol };
    }
    if (char === "/" && this.peek(1) === "=") {
      this.advance();
      this.advance();
      return { type: TokenType.DIV_ASSIGN, line: this.line, col: startCol };
    }
    if (char === "%" && this.peek(1) === "=") {
      this.advance();
      this.advance();
      return { type: TokenType.MOD_ASSIGN, line: this.line, col: startCol };
    }

    // Single character operators
    if (char === "!") {
      this.advance();
      return { type: TokenType.NOT, line: this.line, col: startCol };
    }
    if (char === "=") {
      this.advance();
      return { type: TokenType.ASSIGN, line: this.line, col: startCol };
    }
    if (char === "<") {
      this.advance();
      return { type: TokenType.LT, line: this.line, col: startCol };
    }
    if (char === ">") {
      this.advance();
      return { type: TokenType.GT, line: this.line, col: startCol };
    }
    if (char === "+") {
      this.advance();
      return { type: TokenType.PLUS, line: this.line, col: startCol };
    }
    if (char === "-") {
      // Could be minus or negative number
      if (/\d/.test(this.peek(1))) {
        return this.readNumber();
      }
      this.advance();
      return { type: TokenType.MINUS, line: this.line, col: startCol };
    }
    if (char === "*") {
      this.advance();
      return { type: TokenType.MUL, line: this.line, col: startCol };
    }
    if (char === "/") {
      this.advance();
      return { type: TokenType.DIV, line: this.line, col: startCol };
    }
    if (char === "%") {
      this.advance();
      return { type: TokenType.MOD, line: this.line, col: startCol };
    }

    // Numbers
    if (/\d/.test(char)) {
      return this.readNumber();
    }

    // Identifiers
    if (/[a-zA-Z_]/.test(char)) {
      return this.readIdentifier();
    }

    throw new Error(
      `Unexpected character '${char}' at line ${this.line}, col ${this.col}`
    );
  }

  tokenize() {
    const tokens = [];
    let token;
    do {
      token = this.nextToken();
      tokens.push(token);
    } while (token.type !== TokenType.EOF);
    return tokens;
  }
}

/**
 * Parser - converts tokens to AST
 */
class Parser {
  constructor(tokens) {
    this.tokens = tokens;
    this.pos = 0;
  }

  peek(offset = 0) {
    const index = this.pos + offset;
    if (index >= this.tokens.length) {
      return this.tokens[this.tokens.length - 1]; // EOF
    }
    return this.tokens[index];
  }

  advance() {
    return this.tokens[this.pos++];
  }

  check(type) {
    return this.peek().type === type;
  }

  match(...types) {
    for (const type of types) {
      if (this.check(type)) {
        return this.advance();
      }
    }
    return null;
  }

  expect(type, message) {
    const token = this.peek();
    if (token.type !== type) {
      throw new Error(
        `${message} at line ${token.line}, col ${token.col}. Got ${token.type}`
      );
    }
    return this.advance();
  }

  isAtEnd() {
    return this.peek().type === TokenType.EOF;
  }

  // Parse the effect sequence (top level)
  parseEffectSequence() {
    const effects = [];

    while (!this.isAtEnd()) {
      const effect = this.parseEffect();
      if (effect) {
        effects.push(effect);
      }

      // Skip optional semicolons between effects
      while (this.match(TokenType.SEMICOLON)) {
        // Continue
      }
    }

    return { type: "sequence", effects };
  }

  // Parse a single effect (phase block, condition block, action, or modifier)
  parseEffect() {
    const token = this.peek();

    if (token.type === TokenType.AT) {
      return this.parsePhaseBlock();
    }
    if (token.type === TokenType.IF) {
      return this.parseConditionBlock();
    }
    if (token.type === TokenType.TARGET) {
      return this.parseTargetBlock();
    }
    if (token.type === TokenType.DO) {
      return this.parseAction();
    }
    if (
      [
        TokenType.LIMIT,
        TokenType.TTL,
        TokenType.DELAY,
        TokenType.GROUP,
        TokenType.LINE,
        TokenType.LEVEL,
      ].includes(token.type)
    ) {
      return this.parseModifier();
    }

    if (token.type === TokenType.EOF || token.type === TokenType.RBRACE) {
      return null;
    }

    throw new Error(
      `Unexpected token ${token.type} at line ${token.line}, col ${token.col}`
    );
  }

  // Parse phase block: at:phase { body }
  parsePhaseBlock() {
    this.expect(TokenType.AT, "Expected 'at'");
    this.expect(TokenType.COLON, "Expected ':' after 'at'");

    const phaseToken = this.expect(TokenType.IDENTIFIER, "Expected phase name");
    const phase = phaseToken.value;

    this.expect(TokenType.LBRACE, "Expected '{' after phase");

    const body = this.parseEffectBody();

    this.expect(TokenType.RBRACE, "Expected '}' to close phase block");

    return { type: "phase", phase, body };
  }

  // Parse condition block: if:condition { body }
  parseConditionBlock() {
    this.expect(TokenType.IF, "Expected 'if'");
    this.expect(TokenType.COLON, "Expected ':' after 'if'");

    const condition = this.parseCondition();

    // Body is optional - allows `if:condition` without `{ ... }`
    // This is useful for skill card conditions that just check a condition
    let body = [];
    if (this.match(TokenType.LBRACE)) {
      body = this.parseEffectBody();
      this.expect(TokenType.RBRACE, "Expected '}' to close condition block");
    }

    return { type: "condition", expr: condition, body };
  }

  // Parse target block: target:target { body }
  parseTargetBlock() {
    this.expect(TokenType.TARGET, "Expected 'target'");
    this.expect(TokenType.COLON, "Expected ':' after 'target'");

    const target = this.parseTargetExpr();

    this.expect(TokenType.LBRACE, "Expected '{' after target");

    const body = this.parseEffectBody();

    this.expect(TokenType.RBRACE, "Expected '}' to close target block");

    return { type: "target", target, body };
  }

  // Parse target expression (identifier, number, function call, or complex expression)
  // Examples: mental, hand, 382, effect(fullPowerCharge)*active
  parseTargetExpr() {
    // Build target expression as a string, handling complex patterns
    let expr = "";

    // Accept identifier or number as the start
    if (this.check(TokenType.IDENTIFIER)) {
      const idToken = this.advance();
      expr = idToken.value;

      // Check for function call
      if (this.match(TokenType.LPAREN)) {
        expr += "(";
        if (!this.check(TokenType.RPAREN)) {
          do {
            if (this.check(TokenType.IDENTIFIER)) {
              expr += this.advance().value;
            } else if (this.check(TokenType.NUMBER)) {
              expr += this.advance().value;
            }
          } while (this.match(TokenType.COMMA) && (expr += ","));
        }
        this.expect(TokenType.RPAREN, "Expected ')' after target arguments");
        expr += ")";
      }
    } else if (this.check(TokenType.NUMBER)) {
      expr = String(this.advance().value);
    } else {
      throw new Error(
        `Expected target name at line ${this.current().line}, col ${this.current().col}. Got ${this.current().type}`
      );
    }

    // Handle complex expressions like active*effect(fullPowerCharge)
    while (this.check(TokenType.MUL)) {
      this.advance();
      expr += "*";

      if (this.check(TokenType.IDENTIFIER)) {
        const nextId = this.advance().value;
        expr += nextId;

        if (this.match(TokenType.LPAREN)) {
          expr += "(";
          if (!this.check(TokenType.RPAREN)) {
            do {
              if (this.check(TokenType.IDENTIFIER)) {
                expr += this.advance().value;
              } else if (this.check(TokenType.NUMBER)) {
                expr += this.advance().value;
              }
            } while (this.match(TokenType.COMMA) && (expr += ","));
          }
          this.expect(TokenType.RPAREN, "Expected ')' after target arguments");
          expr += ")";
        }
      }
    }

    return expr;
  }

  // Parse action: do:assignment
  parseAction() {
    this.expect(TokenType.DO, "Expected 'do'");
    this.expect(TokenType.COLON, "Expected ':' after 'do'");

    const expr = this.parseAssignmentExpr();

    return { type: "action", expr };
  }

  // Parse modifier: limit:N, ttl:N, delay:N, group:N
  parseModifier() {
    const token = this.advance();
    this.expect(TokenType.COLON, `Expected ':' after '${token.value}'`);

    const value = this.expect(TokenType.NUMBER, `Expected number after ':'`);

    const modifierMap = {
      [TokenType.LIMIT]: "limit",
      [TokenType.TTL]: "ttl",
      [TokenType.DELAY]: "delay",
      [TokenType.GROUP]: "group",
      [TokenType.LINE]: "line",
      [TokenType.LEVEL]: "level",
    };

    return { type: modifierMap[token.type], value: value.value };
  }

  // Parse effect body (list of effects inside braces)
  parseEffectBody() {
    const body = [];

    while (
      !this.check(TokenType.RBRACE) &&
      !this.check(TokenType.EOF)
    ) {
      const effect = this.parseEffect();
      if (effect) {
        body.push(effect);
      }

      // Skip optional semicolons
      while (this.match(TokenType.SEMICOLON)) {
        // Continue
      }
    }

    return body;
  }

  // Parse condition expression (with OR)
  parseCondition() {
    return this.parseOrExpr();
  }

  // Parse OR expression: andExpr ("|" andExpr)*
  parseOrExpr() {
    let left = this.parseAndExpr();

    while (this.match(TokenType.OR)) {
      const right = this.parseAndExpr();
      left = { type: "binary", op: "|", left, right };
    }

    return left;
  }

  // Parse AND expression: unaryExpr ("&" unaryExpr)*
  parseAndExpr() {
    let left = this.parseUnaryCondition();

    while (this.match(TokenType.AND)) {
      const right = this.parseUnaryCondition();
      left = { type: "binary", op: "&", left, right };
    }

    return left;
  }

  // Parse unary condition: "!" unaryExpr | comparisonExpr
  parseUnaryCondition() {
    if (this.match(TokenType.NOT)) {
      const operand = this.parseUnaryCondition();
      return { type: "unary", op: "!", operand };
    }

    return this.parseComparisonExpr();
  }

  // Parse comparison expression
  parseComparisonExpr() {
    // Handle parenthesized conditions
    if (this.check(TokenType.LPAREN)) {
      this.advance();
      const expr = this.parseCondition();
      this.expect(TokenType.RPAREN, "Expected ')' after condition");
      return expr;
    }

    const left = this.parseAddExpr();

    const compOps = [
      TokenType.EQ,
      TokenType.NE,
      TokenType.LT,
      TokenType.GT,
      TokenType.LE,
      TokenType.GE,
    ];
    const opToken = this.match(...compOps);

    if (opToken) {
      const right = this.parseAddExpr();
      const opMap = {
        [TokenType.EQ]: "==",
        [TokenType.NE]: "!=",
        [TokenType.LT]: "<",
        [TokenType.GT]: ">",
        [TokenType.LE]: "<=",
        [TokenType.GE]: ">=",
      };
      return { type: "comparison", op: opMap[opToken.type], left, right };
    }

    // If no comparison operator, this is a truthy check (like isFullPower)
    return left;
  }

  // Parse assignment expression
  parseAssignmentExpr() {
    // Check for special actions (single identifiers or function calls)
    const lookahead = this.peek(1);

    // Function call or assignment
    if (this.check(TokenType.IDENTIFIER)) {
      const idToken = this.advance();

      // Function call: identifier(args)
      if (this.match(TokenType.LPAREN)) {
        const args = [];
        if (!this.check(TokenType.RPAREN)) {
          do {
            args.push(this.parseExpression());
          } while (this.match(TokenType.COMMA));
        }
        this.expect(TokenType.RPAREN, "Expected ')' after arguments");
        return { type: "call", name: idToken.value, args };
      }

      // Assignment: identifier op= expression
      const assignOps = [
        TokenType.ASSIGN,
        TokenType.PLUS_ASSIGN,
        TokenType.MINUS_ASSIGN,
        TokenType.MUL_ASSIGN,
        TokenType.DIV_ASSIGN,
        TokenType.MOD_ASSIGN,
      ];
      const opToken = this.match(...assignOps);

      if (opToken) {
        const rhs = this.parseExpression();
        const opMap = {
          [TokenType.ASSIGN]: "=",
          [TokenType.PLUS_ASSIGN]: "+=",
          [TokenType.MINUS_ASSIGN]: "-=",
          [TokenType.MUL_ASSIGN]: "*=",
          [TokenType.DIV_ASSIGN]: "/=",
          [TokenType.MOD_ASSIGN]: "%=",
        };
        return {
          type: "assignment",
          lhs: idToken.value,
          op: opMap[opToken.type],
          rhs,
        };
      }

      // Just an identifier (special action)
      return { type: "identifier", name: idToken.value };
    }

    throw new Error(
      `Expected identifier at line ${this.peek().line}, col ${this.peek().col}`
    );
  }

  // Parse expression
  parseExpression() {
    return this.parseAddExpr();
  }

  // Parse additive expression: mulExpr (("+" | "-") mulExpr)*
  parseAddExpr() {
    let left = this.parseMulExpr();

    while (true) {
      const opToken = this.match(TokenType.PLUS, TokenType.MINUS);
      if (!opToken) break;

      const right = this.parseMulExpr();
      const op = opToken.type === TokenType.PLUS ? "+" : "-";
      left = { type: "binary", op, left, right };
    }

    return left;
  }

  // Parse multiplicative expression: unaryMath (("*" | "/" | "%") unaryMath)*
  parseMulExpr() {
    let left = this.parseUnaryMath();

    while (true) {
      const opToken = this.match(TokenType.MUL, TokenType.DIV, TokenType.MOD);
      if (!opToken) break;

      const right = this.parseUnaryMath();
      const opMap = {
        [TokenType.MUL]: "*",
        [TokenType.DIV]: "/",
        [TokenType.MOD]: "%",
      };
      left = { type: "binary", op: opMap[opToken.type], left, right };
    }

    return left;
  }

  // Parse unary math: "-" unaryMath | primaryExpr
  parseUnaryMath() {
    if (this.match(TokenType.MINUS)) {
      const operand = this.parseUnaryMath();
      return { type: "unary", op: "-", operand };
    }

    return this.parsePrimaryExpr();
  }

  // Parse primary expression
  parsePrimaryExpr() {
    // Parenthesized expression
    if (this.match(TokenType.LPAREN)) {
      const expr = this.parseExpression();
      this.expect(TokenType.RPAREN, "Expected ')' after expression");
      return expr;
    }

    // Number
    if (this.check(TokenType.NUMBER)) {
      const token = this.advance();
      return { type: "number", value: token.value };
    }

    // Identifier or function call
    if (this.check(TokenType.IDENTIFIER)) {
      const idToken = this.advance();

      // Function call
      if (this.match(TokenType.LPAREN)) {
        const args = [];
        if (!this.check(TokenType.RPAREN)) {
          do {
            args.push(this.parseExpression());
          } while (this.match(TokenType.COMMA));
        }
        this.expect(TokenType.RPAREN, "Expected ')' after arguments");
        return { type: "call", name: idToken.value, args };
      }

      return { type: "identifier", name: idToken.value };
    }

    throw new Error(
      `Unexpected token in expression at line ${this.peek().line}, col ${this.peek().col}`
    );
  }
}

/**
 * Main parse function
 */
export function parseEffects(input) {
  if (!input || !input.trim()) {
    return { type: "sequence", effects: [] };
  }

  const tokenizer = new Tokenizer(input);
  const tokens = tokenizer.tokenize();
  const parser = new Parser(tokens);
  return parser.parseEffectSequence();
}

/**
 * Export for testing
 */
export { Tokenizer, Parser, TokenType };
