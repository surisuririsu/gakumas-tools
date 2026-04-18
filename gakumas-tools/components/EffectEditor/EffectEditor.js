import { memo, useMemo } from "react";
import { highlightEffects } from "@/utils/effectSyntax";
import styles from "./EffectEditor.module.scss";

const INDENT = "  ";

// `execCommand("insertText", ...)` is deprecated but still the only way to
// mutate a textarea programmatically while preserving native undo history.
function insertText(text) {
  document.execCommand("insertText", false, text);
}

function handleKeyDown(e) {
  if (e.key === "Enter") {
    e.preventDefault();
    const { selectionStart, value } = e.currentTarget;
    const lineStart = value.lastIndexOf("\n", selectionStart - 1) + 1;
    const currentIndent = value
      .slice(lineStart, selectionStart)
      .match(/^\s*/)[0];
    const extra = value[selectionStart - 1] === "{" ? INDENT : "";
    insertText(`\n${currentIndent}${extra}`);
  } else if (e.key === "Tab") {
    e.preventDefault();
    insertText(INDENT);
  }
}

function EffectEditor({ value, onChange }) {
  const parts = useMemo(() => highlightEffects(value), [value]);

  return (
    <div className={styles.editor}>
      <pre className={styles.highlight} aria-hidden="true">
        {parts.map((part, i) =>
          part.className ? (
            <span key={i} className={styles[part.className]}>
              {part.text}
            </span>
          ) : (
            part.text
          )
        )}
        {"\n"}
      </pre>
      <textarea
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
}

export default memo(EffectEditor);
