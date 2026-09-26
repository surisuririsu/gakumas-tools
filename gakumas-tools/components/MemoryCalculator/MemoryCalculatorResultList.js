import { memo, useEffect, useRef, useState } from "react";
import MemoryCalculatorResult from "./MemoryCalculatorResult";
import styles from "./MemoryCalculator.module.scss";

const PAGE_SIZE = 60;

function MemoryCalculatorResultList({ memories, idolId }) {
  const [shown, setShown] = useState({ memories, count: PAGE_SIZE });
  if (shown.memories !== memories) {
    setShown({ memories, count: PAGE_SIZE });
  }
  const count = shown.memories === memories ? shown.count : PAGE_SIZE;
  const hasMore = count < memories.length;
  const moreRef = useRef(null);

  useEffect(() => {
    if (!hasMore) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown((cur) => ({ ...cur, count: cur.count + PAGE_SIZE }));
      },
      { rootMargin: "400px" }
    );
    observer.observe(moreRef.current);
    return () => observer.disconnect();
  }, [hasMore, count]);

  return (
    <div>
      {memories.slice(0, count).map((memory) => (
        <MemoryCalculatorResult
          key={memory.skillCardIds.join(",")}
          skillCardIds={memory.skillCardIds}
          probability={memory.probability}
          idolId={idolId}
        />
      ))}
      {hasMore && <div ref={moreRef} className={styles.moreResults} />}
    </div>
  );
}

export default memo(MemoryCalculatorResultList);
