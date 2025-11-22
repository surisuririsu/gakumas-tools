"use client";
import { memo } from "react";
import { List } from "react-window";
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
  const Row = ({ memories, index, style }) => {
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
        <List
          rowComponent={memo(Row)}
          rowCount={memories.length}
          rowHeight={110}
          rowProps={{ memories }}
        />
      ) : (
        <MemoriesNudge />
      )}
    </div>
  );
}

export default memo(MemoriesList);
