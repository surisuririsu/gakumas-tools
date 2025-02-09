import { useState } from "react";
import styles from "./ParamOrderPicker.module.scss";

export default function ParamOrderPicker({
  initialOrder = [1, 2, 3],
  onChange,
}) {
  const [order, setOrder] = useState(initialOrder);

  function promote(index) {
    if (order[index] == 1) return;
    let newOrder = [...order];
    const swapIndex = order.indexOf(order[index] - 1);
    newOrder[index] = order[index] - 1;
    newOrder[swapIndex] = order[index];
    onChange?.(newOrder);
    setOrder(newOrder);
  }

  return (
    <div className={styles.picker}>
      {order.map((val, i) => (
        <div key={i} className={styles.column}>
          <div style={{ flex: Math.pow(val - 1, 2) }}></div>
          <button onClick={() => promote(i)}></button>
        </div>
      ))}
    </div>
  );
}
