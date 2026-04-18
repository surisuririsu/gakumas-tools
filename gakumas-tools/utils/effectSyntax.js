import { Tokenizer, TokenType } from "gakumas-data-structured";

const KEYWORD_TYPES = new Set([
  TokenType.AT,
  TokenType.IF,
  TokenType.DO,
  TokenType.TARGET,
  TokenType.LIMIT,
  TokenType.TTL,
  TokenType.DELAY,
  TokenType.GROUP,
  TokenType.LINE,
  TokenType.LEVEL,
]);

const PUNCTUATION_TYPES = new Set([
  TokenType.LBRACE,
  TokenType.RBRACE,
  TokenType.LPAREN,
  TokenType.RPAREN,
  TokenType.LBRACKET,
  TokenType.RBRACKET,
  TokenType.SEMICOLON,
  TokenType.COLON,
  TokenType.COMMA,
]);

const OPERATOR_TYPES = new Set([
  TokenType.EQ,
  TokenType.NE,
  TokenType.LT,
  TokenType.GT,
  TokenType.LE,
  TokenType.GE,
  TokenType.ASSIGN,
  TokenType.PLUS_ASSIGN,
  TokenType.MINUS_ASSIGN,
  TokenType.MUL_ASSIGN,
  TokenType.DIV_ASSIGN,
  TokenType.MOD_ASSIGN,
  TokenType.PLUS,
  TokenType.MINUS,
  TokenType.MUL,
  TokenType.DIV,
  TokenType.MOD,
  TokenType.AND,
  TokenType.OR,
  TokenType.NOT,
]);

const OPERATOR_TEXT = {
  [TokenType.EQ]: "==",
  [TokenType.NE]: "!=",
  [TokenType.LT]: "<",
  [TokenType.GT]: ">",
  [TokenType.LE]: "<=",
  [TokenType.GE]: ">=",
  [TokenType.ASSIGN]: "=",
  [TokenType.PLUS_ASSIGN]: "+=",
  [TokenType.MINUS_ASSIGN]: "-=",
  [TokenType.MUL_ASSIGN]: "*=",
  [TokenType.DIV_ASSIGN]: "/=",
  [TokenType.MOD_ASSIGN]: "%=",
  [TokenType.PLUS]: "+",
  [TokenType.MINUS]: "-",
  [TokenType.MUL]: "*",
  [TokenType.DIV]: "/",
  [TokenType.MOD]: "%",
  [TokenType.AND]: "&",
  [TokenType.OR]: "|",
  [TokenType.NOT]: "!",
  [TokenType.AT_SIGN]: "@",
  [TokenType.LBRACE]: "{",
  [TokenType.RBRACE]: "}",
  [TokenType.LPAREN]: "(",
  [TokenType.RPAREN]: ")",
  [TokenType.LBRACKET]: "[",
  [TokenType.RBRACKET]: "]",
  [TokenType.SEMICOLON]: ";",
  [TokenType.COLON]: ":",
  [TokenType.COMMA]: ",",
};

function classForToken(type) {
  if (KEYWORD_TYPES.has(type)) return "keyword";
  if (PUNCTUATION_TYPES.has(type)) return "punctuation";
  if (OPERATOR_TYPES.has(type)) return "operator";
  if (type === TokenType.NUMBER) return "number";
  if (type === TokenType.IDENTIFIER) return "identifier";
  if (type === TokenType.AT_SIGN) return "anchor";
  return null;
}

// Pair EOF-terminated token list with source offsets so preserved whitespace
// can be emitted between tokens. The tokenizer strips whitespace but records
// line/col, which is enough to reconstruct spans via a linear walk.
export function highlightEffects(input) {
  if (!input) return [{ className: null, text: "" }];

  let tokens;
  try {
    tokens = new Tokenizer(input).tokenize();
  } catch {
    return [{ className: null, text: input }];
  }

  const parts = [];
  let cursor = 0;

  for (const token of tokens) {
    if (token.type === TokenType.EOF) break;

    // Keywords, identifiers, and numbers all carry their original text in
    // `value`; punctuation/operator tokens don't, so fall back to the
    // fixed lexeme table.
    const text =
      token.value != null
        ? String(token.value)
        : OPERATOR_TEXT[token.type] || "";

    if (!text) continue;

    // Locate the token in the source starting from cursor. The tokenizer's
    // line/col aren't byte offsets, so scan for the next occurrence — any
    // skipped characters are whitespace the tokenizer discarded.
    const idx = input.indexOf(text, cursor);
    if (idx === -1) {
      // Shouldn't happen for valid input, but fail safe: emit remaining raw.
      parts.push({ className: null, text: input.slice(cursor) });
      cursor = input.length;
      break;
    }

    if (idx > cursor) {
      parts.push({ className: null, text: input.slice(cursor, idx) });
    }

    parts.push({ className: classForToken(token.type), text });
    cursor = idx + text.length;
  }

  if (cursor < input.length) {
    parts.push({ className: null, text: input.slice(cursor) });
  }

  return parts;
}
