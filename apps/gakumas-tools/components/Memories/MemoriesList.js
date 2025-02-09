"use client";
import { memo } from "react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import MemorySummary from "@/components/MemorySummary";
import MemoriesNudge from "./MemoriesNudge";
import styles from "./Memories.module.scss";

function MemoriesList({
  memories,
  deleting,
  picking,
  selectedMemories,
  setSelectedMemories,
  onPick,
}) {
  const Row = ({ index, style }) => {
    const memory = memories[index];
    return (
      <div className={styles.memoryTile} style={style}>
        {deleting && (
          <div className={styles.check}>
            <input
              type="checkbox"
              checked={selectedMemories[memory._id]}
              onChange={(e) =>
                setSelectedMemories((prev) => ({
                  ...prev,
                  [memory._id]: e.target.checked,
                }))
              }
            />
          </div>
        )}
        <MemorySummary
          memory={memory}
          picking={picking}
          onClick={() => onPick(memory)}
        />
      </div>
    );
  };

  return (
    <div className={styles.list}>
      {memories.length ? (
        <AutoSizer>
          {({ width, height }) => (
            <List
              height={height}
              itemCount={memories.length}
              itemSize={110}
              width={width}
            >
              {memo(Row)}
            </List>
          )}
        </AutoSizer>
      ) : (
        <MemoriesNudge />
      )}
    </div>
  );
}

export default memo(MemoriesList);
