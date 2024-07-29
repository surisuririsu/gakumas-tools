import { useContext, useEffect, useState } from "react";
import {
  FaCircleXmark,
  FaMagnifyingGlass,
  FaFileImport,
  FaRegTrashCan,
} from "react-icons/fa6";
import { useSession, signIn } from "next-auth/react";
import { PItems, SkillCards } from "gakumas-data";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import MemoryImporter from "@/components//MemoryImporter";
import MemorySummary from "@/components/MemorySummary";
import StagePItems from "@/components/StagePItems";
import StageSkillCards from "@/components/StageSkillCards";
import Trash from "@/components/Trash";
import DataContext from "@/contexts/DataContext";
import SearchContext from "@/contexts/SearchContext";
import { calculateContestPower } from "@/utils/contestPower";
import styles from "./Memories.module.scss";

export default function Memories() {
  const { status } = useSession();
  const { memories, fetchMemories } = useContext(DataContext);
  const { pItemIds, skillCardIds } = useContext(SearchContext);
  const [action, setAction] = useState(null);
  const [selectedMemories, setSelectedMemories] = useState({});

  const selectedMemoryIds = Object.keys(selectedMemories).filter(
    (s) => selectedMemories[s]
  );

  const hasSearchQuery = pItemIds.some((i) => i) || skillCardIds.some((i) => i);
  const displayedMemories = memories
    .map((memory) => {
      memory.searchScore = hasSearchQuery ? getSearchScore(memory) : 1;
      memory.contestPower = calculateContestPower(
        memory.params,
        memory.pItemIds,
        memory.skillCardIds
      );
      return memory;
    })
    .filter((memory) => memory.searchScore)
    .sort((a, b) => {
      if (hasSearchQuery) {
        if (b.searchScore != a.searchScore) {
          return b.searchScore - a.searchScore;
        } else {
          return b.contestPower - a.contestPower;
        }
      } else {
        if (
          b.name.indexOf("(FIXME)") != -1 ||
          a.name.indexOf("(FIXME)") != -1
        ) {
          return b.name.indexOf("(FIXME)") - a.name.indexOf("(FIXME)");
        } else {
          return b.contestPower - a.contestPower;
        }
      }
    });

  useEffect(() => {
    if (status == "authenticated") {
      fetchMemories();
    }
  }, [status]);

  async function deleteMemories() {
    const result = await fetch("/api/memory/bulk_delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedMemoryIds }),
    });
    fetchMemories();
    setSelectedMemories({});
  }

  function getSearchScore(memory) {
    let score = 0;
    pItemIds
      .filter((i) => !!i)
      .map(PItems.getById)
      .forEach((pItem, i) => {
        const multiplier = Math.pow(0.95, i);
        if (memory.pItemIds.includes(pItem.id)) score += 1 * multiplier;
        if (pItem.sourceType == "pIdol") {
          if (!pItem.upgraded && memory.pItemIds.includes(pItem.id + 1))
            score += 0.6 * multiplier;
          if (pItem.upgraded && memory.pItemIds.includes(pItem.id - 1))
            score += 0.5 * multiplier;
        }
      });
    skillCardIds
      .filter((i) => !!i)
      .map(SkillCards.getById)
      .forEach((skillCard, i) => {
        const multiplier = Math.pow(0.95, i);
        if (memory.skillCardIds.includes(skillCard.id)) score += 1 * multiplier;
        if (skillCard.type != "trouble") {
          if (
            !skillCard.upgraded &&
            memory.skillCardIds.includes(skillCard.id + 1)
          )
            score += 0.6 * multiplier;
          if (
            skillCard.upgraded &&
            memory.skillCardIds.includes(skillCard.id - 1)
          )
            score += 0.5 * multiplier;
        }
      });
    return score;
  }

  return (
    <div className={styles.memories}>
      {status == "authenticated" && (
        <>
          <div className={styles.header}>
            {action ? (
              <div>
                <IconButton
                  icon={FaCircleXmark}
                  onClick={() => setAction(null)}
                />
              </div>
            ) : (
              <>
                <IconButton
                  icon={FaMagnifyingGlass}
                  onClick={() => setAction("search")}
                />
                <IconButton
                  icon={FaFileImport}
                  onClick={() => setAction("import")}
                />
                <IconButton
                  icon={FaRegTrashCan}
                  onClick={() => setAction("delete")}
                />
              </>
            )}
            {action == "search" && (
              <div className={styles.search}>
                <StagePItems
                  pItemIds={pItemIds}
                  widget="memories"
                  size="small"
                />
                <StageSkillCards
                  skillCardIds={skillCardIds}
                  widget="memories"
                  size="medium"
                />
                <Trash size="small" />
              </div>
            )}
            {action == "import" && (
              <MemoryImporter onClose={() => setAction(null)} />
            )}
            {action == "delete" && (
              <div className={styles.delete}>
                {selectedMemoryIds.length} memories selected{" "}
                <Button
                  style="red"
                  onClick={deleteMemories}
                  disabled={!selectedMemoryIds.length}
                >
                  Delete
                </Button>
              </div>
            )}
          </div>
          <div className={styles.list}>
            {displayedMemories.map((memory) => (
              <div key={memory._id} className={styles.memoryTile}>
                {action == "delete" && (
                  <div className={styles.check}>
                    <input
                      type="checkbox"
                      checked={selectedMemories[memory._id] || false}
                      onChange={(e) =>
                        setSelectedMemories((prev) => ({
                          ...prev,
                          [memory._id]: e.target.checked,
                        }))
                      }
                      readOnly
                    />
                  </div>
                )}
                <MemorySummary memory={memory} />
              </div>
            ))}
            {action != "import" && (
              <div className={styles.nudge}>
                <Button onClick={() => setAction("import")}>
                  Import memories from screenshots
                </Button>
              </div>
            )}
          </div>
        </>
      )}
      {status == "unauthenticated" && (
        <div className={styles.nudge}>
          <Button onClick={() => signIn("discord")}>
            Sign in with Discord to save/load memories
          </Button>
        </div>
      )}
    </div>
  );
}
