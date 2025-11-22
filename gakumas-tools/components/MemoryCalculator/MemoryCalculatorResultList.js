import { memo } from "react";
import { List } from "react-window";
import MemoryCalculatorResult from "./MemoryCalculatorResult";

const ROW_HEIGHT = 72;
const WINDOW_SIZE = 8;

function MemoryCalculatorResultList({ memories, idolId }) {
  const Row = ({ index, style }) => {
    const { skillCardIds, probability } = memories[index];
    return (
      <MemoryCalculatorResult
        key={skillCardIds}
        style={style}
        skillCardIds={skillCardIds}
        probability={probability}
        idolId={idolId}
      />
    );
  };

  return (
    <div
      style={{ height: Math.min(memories.length, WINDOW_SIZE) * ROW_HEIGHT }}
    >
      <List
        rowComponent={memo(Row)}
        rowCount={memories.length}
        rowHeight={ROW_HEIGHT}
        rowProps={{ memories }}
      />
    </div>
  );
}

export default memo(MemoryCalculatorResultList);
