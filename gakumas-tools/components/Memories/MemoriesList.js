"use client";
import { memo } from "react";
import { FaCheck } from "react-icons/fa6";
import { List } from "react-window";
import MemorySummary from "@/components/MemorySummary";
import c from "@/utils/classNames";
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
  const checked = !!selectedMemories?.[memory._id];
  return (
    <div
      className={c(
        styles.memoryTile,
        deleting && styles.deleting,
        deleting && checked && styles.checked
      )}
      style={style}
      {...ariaAttributes}
    >
      {setSelectedMemories && (
        <label className={styles.check} inert={!deleting}>
          <input
            type="checkbox"
            checked={checked}
            onChange={(e) =>
              setSelectedMemories((prev) => ({
                ...prev,
                [memory._id]: e.target.checked,
              }))
            }
          />
          <span className={styles.checkBox} aria-hidden="true">
            <FaCheck />
          </span>
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
