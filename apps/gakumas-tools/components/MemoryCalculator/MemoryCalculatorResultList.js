import { memo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
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
      <AutoSizer>
        {({ width, height }) => (
          <List
            height={height}
            itemCount={memories.length}
            itemSize={ROW_HEIGHT}
            width={width}
          >
            {memo(Row)}
          </List>
        )}
      </AutoSizer>
    </div>
  );
}

export default memo(MemoryCalculatorResultList);
