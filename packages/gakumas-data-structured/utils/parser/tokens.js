/**
 * Token types for the effects language
 */
export const TokenType = {
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
  LBRACKET: "LBRACKET",
  RBRACKET: "RBRACKET",
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

/**
 * Keywords map (lowercase keyword -> token type)
 */
export const KEYWORDS = {
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
