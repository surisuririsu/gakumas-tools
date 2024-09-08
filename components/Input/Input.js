import { memo, useEffect, useState } from "react";
import styles from "./Input.module.scss";

function Input({ type, name, value, min, max, round, placeholder, onChange }) {
  // To prevent onChange triggering before IME input committed
  const [composing, setComposing] = useState(false);
  const [inter, setInter] = useState(value);

  useEffect(() => {
    if (!composing) onChange(inter);
  }, [composing, inter]);

  function handleChange(val) {
    val = val.normalize("NFKC");
    if (type == "number") {
      if (round) {
        val = parseInt(val, 10);
      } else {
        val = parseFloat(val);
      }
      if (min != null) val = Math.max(val, min);
      if (max != null) val = Math.min(val, max);
      if (isNaN(val)) val = null;
    }
    setInter(val);
  }

  return (
    <input
      className={styles.input}
      type={type}
      name={name}
      placeholder={placeholder}
      value={inter}
      onChange={(e) => handleChange(e.target.value)}
      onCompositionStart={() => setComposing(true)}
      onCompositionEnd={(e) => {
        handleChange(e.data);
        setComposing(false);
      }}
    />
  );
}

export default memo(Input);
