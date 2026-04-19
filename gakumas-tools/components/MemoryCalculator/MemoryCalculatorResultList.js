import { memo } from "react";
import MemoryCalculatorResult from "./MemoryCalculatorResult";

function MemoryCalculatorResultList({ memories, idolId }) {
  return (
    <div>
      {memories.map((memory) => (
        <MemoryCalculatorResult
          key={memory.skillCardIds.join(",")}
          skillCardIds={memory.skillCardIds}
          probability={memory.probability}
          idolId={idolId}
        />
      ))}
    </div>
  );
}

export default memo(MemoryCalculatorResultList);
