"use client";
import { memo, useContext, useMemo, useState } from "react";
import Button from "@/components/Button";
import MemoryImporterModal from "@/components/MemoryImporterModal";
import MemorySummary from "@/components/MemorySummary";
import DataContext from "@/contexts/DataContext";
import ModalContext from "@/contexts/ModalContext";
import SearchContext from "@/contexts/SearchContext";
import { calculateContestPower } from "@/utils/contestPower";
import { getSearchScore } from "@/utils/sort";
import styles from "./Memories.module.scss";

const PAGE_SIZE = 30;

function compareFilteredMemories(a, b) {
  if (b.searchScore != a.searchScore) {
    return b.searchScore - a.searchScore;
  } else {
    return b.contestPower - a.contestPower;
  }
}

function compareUnfilteredMemories(a, b) {
  if (b.name?.indexOf("(FIXME)") > -1) {
    return 1;
  } else if (a.name?.indexOf("(FIXME)") > -1) {
    return -1;
  } else {
    return b.contestPower - a.contestPower;
  }
}

function MemoriesList({
  memories,
  action,
  selectedMemories,
  setSelectedMemories,
}) {
  const { uploadMemories, memoriesLoading } = useContext(DataContext);
  const { setModal } = useContext(ModalContext);
  const { pItemIds, skillCardIds } = useContext(SearchContext);
  const [maxToShow, setMaxToShow] = useState(PAGE_SIZE);

  const hasSearchQuery = pItemIds.some((i) => i) || skillCardIds.some((i) => i);
  const filteredMemories = useMemo(
    () =>
      memories
        .map((memory) => {
          memory.searchScore = hasSearchQuery
            ? getSearchScore(memory, pItemIds, skillCardIds)
            : 1;
          memory.contestPower = calculateContestPower(
            memory.params,
            memory.pItemIds,
            memory.skillCardIds
          );
          return memory;
        })
        .filter((memory) => memory.searchScore)
        .sort(
          hasSearchQuery ? compareFilteredMemories : compareUnfilteredMemories
        ),
    [memories, pItemIds, skillCardIds]
  );
  const displayedMemories = useMemo(
    () => filteredMemories.slice(0, maxToShow),
    [filteredMemories, maxToShow]
  );

  return (
    <div className={styles.list}>
      {displayedMemories.map((memory) => (
        <div key={memory._id} className={styles.memoryTile}>
          {action == "delete" && (
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
          <MemorySummary memory={memory} />
        </div>
      ))}

      <div className={styles.nudge}>
        {filteredMemories.length > maxToShow && (
          <Button onClick={() => setMaxToShow(maxToShow + PAGE_SIZE)}>
            Show more memories
          </Button>
        )}

        {action != "import" && !memoriesLoading && (
          <Button
            onClick={() =>
              setModal(<MemoryImporterModal onSuccess={uploadMemories} />)
            }
          >
            Import memories from screenshots
          </Button>
        )}
      </div>
    </div>
  );
}

export default memo(MemoriesList);
