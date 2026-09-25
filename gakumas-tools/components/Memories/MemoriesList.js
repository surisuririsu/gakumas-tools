"use client";
import { memo } from "react";
import { List } from "react-window";
import MemorySummary from "@/components/MemorySummary";
import MemoriesNudge from "./MemoriesNudge";
import styles from "./Memories.module.scss";

const Row = memo(function Row({
  index,
  style,
  ariaAttributes,
  memories,
  deleting,
  picking,
  selectedMemories,
  setSelectedMemories,
  onPick,
}) {
  const memory = memories[index];
  return (
    <div className={styles.memoryTile} style={style} {...ariaAttributes}>
      {deleting && (
        <label className={styles.check}>
          <input
            type="checkbox"
            checked={!!selectedMemories[memory._id]}
            onChange={(e) =>
              setSelectedMemories((prev) => ({
                ...prev,
                [memory._id]: e.target.checked,
              }))
            }
          />
        </label>
      )}
      <MemorySummary
        memory={memory}
        picking={picking}
        onClick={() => onPick(memory)}
      />
    </div>
  );
});

function MemoriesList({
  memories,
  filtered,
  deleting,
  picking,
  selectedMemories,
  setSelectedMemories,
  onPick,
}) {
  return (
    <div className={styles.list}>
      {memories.length ? (
        <List
          rowComponent={Row}
          rowCount={memories.length}
          rowHeight={110}
          rowProps={{
            memories,
            deleting,
            picking,
            selectedMemories,
            setSelectedMemories,
            onPick,
          }}
        />
      ) : (
        <MemoriesNudge filtered={filtered} />
      )}
    </div>
  );
}

export default memo(MemoriesList);
