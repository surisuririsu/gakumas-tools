"use client";
import { memo, useContext, useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import DataContext from "@/contexts/DataContext";
import SearchContext from "@/contexts/SearchContext";
import { calculateContestPower } from "@/utils/contestPower";
import {
  compareFilteredMemories,
  compareUnfilteredMemories,
  getSearchScore,
} from "@/utils/sort";
import MemoriesHeader from "./MemoriesHeader";
import MemoriesList from "./MemoriesList";
import styles from "./Memories.module.scss";

function Memories() {
  const { status } = useSession();
  const { memories, fetchMemories } = useContext(DataContext);
  const { pItemIds, skillCardIds } = useContext(SearchContext);
  const [action, setAction] = useState(null);
  const [selectedMemories, setSelectedMemories] = useState({});

  useEffect(() => {
    if (status == "authenticated" && !memories.length) {
      fetchMemories();
    }
  }, [status]);

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
            memory.skillCardIds,
            memory.customizations
          );
          return memory;
        })
        .filter((memory) => memory.searchScore)
        .sort(
          hasSearchQuery ? compareFilteredMemories : compareUnfilteredMemories
        ),
    [memories, pItemIds, skillCardIds, hasSearchQuery]
  );

  return (
    <div className={styles.memories}>
      <MemoriesHeader
        numMemories={filteredMemories.length}
        action={action}
        setAction={setAction}
        selectedMemories={selectedMemories}
        setSelectedMemories={setSelectedMemories}
      />
      <MemoriesList
        memories={filteredMemories}
        deleting={action == "delete"}
        picking={action == "pick"}
        selectedMemories={selectedMemories}
        setSelectedMemories={setSelectedMemories}
      />
    </div>
  );
}

export default memo(Memories);
