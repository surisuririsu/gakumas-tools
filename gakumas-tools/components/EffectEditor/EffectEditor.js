import { memo, useMemo } from "react";
import { highlightEffects } from "@/utils/effectSyntax";
import styles from "./EffectEditor.module.scss";

function EffectEditor({ value, onChange, minHeight = 120 }) {
  const parts = useMemo(() => highlightEffects(value), [value]);

  return (
    <div className={styles.editor} style={{ minHeight }}>
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
        {/* Trailing newline keeps the cursor line visible after a final \n */}
        {"\n"}
      </pre>
      <textarea
        className={styles.input}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        spellCheck={false}
        autoCorrect="off"
        autoCapitalize="off"
      />
    </div>
  );
}

export default memo(EffectEditor);
