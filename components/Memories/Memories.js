"use client";
import { useContext, useEffect, useState } from "react";
import {
  FaCircleXmark,
  FaMagnifyingGlass,
  FaFileImport,
  FaRegTrashCan,
  FaFilm,
} from "react-icons/fa6";
import { useSession, signIn } from "next-auth/react";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import MemoryImporterModal from "@/components/MemoryImporterModal";
import MemorySummary from "@/components/MemorySummary";
import StagePItems from "@/components/StagePItems";
import StageSkillCards from "@/components/StageSkillCards";
import DataContext from "@/contexts/DataContext";
import SearchContext from "@/contexts/SearchContext";
import { calculateContestPower } from "@/utils/contestPower";
import { getSearchScore } from "@/utils/sort";
import styles from "./Memories.module.scss";
import ModalContext from "@/contexts/ModalContext";

const PAGE_SIZE = 30;

export default function Memories() {
  const { status } = useSession();
  const { memories, fetchMemories, memoriesLoading } = useContext(DataContext);
  const { setModal } = useContext(ModalContext);
  const { pItemIds, skillCardIds, replacePItemId, replaceSkillCardId } =
    useContext(SearchContext);
  const [action, setAction] = useState(null);
  const [selectedMemories, setSelectedMemories] = useState({});
  const [maxToShow, setMaxToShow] = useState(PAGE_SIZE);

  useEffect(() => {
    if (status == "authenticated" && !memories.length) {
      fetchMemories();
    }
  }, [status]);

  const selectedMemoryIds = Object.keys(selectedMemories).filter(
    (s) => selectedMemories[s]
  );

  const hasSearchQuery = pItemIds.some((i) => i) || skillCardIds.some((i) => i);
  const filteredMemories = memories
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
    .sort((a, b) => {
      if (hasSearchQuery) {
        if (b.searchScore != a.searchScore) {
          return b.searchScore - a.searchScore;
        } else {
          return b.contestPower - a.contestPower;
        }
      } else {
        if (b.name?.indexOf("(FIXME)") > -1) {
          return 1;
        } else if (a.name?.indexOf("(FIXME)") > -1) {
          return -1;
        } else {
          return b.contestPower - a.contestPower;
        }
      }
    });
  const displayedMemories = filteredMemories.slice(0, maxToShow);

  async function deleteMemories() {
    await fetch("/api/memory/bulk_delete", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedMemoryIds }),
    });
    fetchMemories();
    setSelectedMemories({});
  }

  return (
    <div className={styles.memories}>
      {status == "authenticated" && (
        <>
          <div className={styles.header}>
            {action ? (
              <IconButton
                icon={FaCircleXmark}
                onClick={() => setAction(null)}
              />
            ) : (
              <>
                <IconButton
                  icon={FaMagnifyingGlass}
                  onClick={() => setAction("search")}
                />
                <IconButton
                  icon={FaFileImport}
                  onClick={() => setModal(<MemoryImporterModal />)}
                />
                <IconButton
                  icon={FaRegTrashCan}
                  onClick={() => setAction("delete")}
                />
                <div className={styles.fill} />
                {!memoriesLoading && (
                  <div className={styles.count}>
                    <FaFilm />
                    {filteredMemories.length}
                  </div>
                )}
              </>
            )}

            {action == "search" && (
              <div className={styles.search}>
                <StagePItems
                  pItemIds={pItemIds}
                  replacePItemId={replacePItemId}
                  size="small"
                />
                <StageSkillCards
                  skillCardIds={skillCardIds}
                  replaceSkillCardId={replaceSkillCardId}
                  size="medium"
                />
              </div>
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
                <Button onClick={() => setModal(<MemoryImporterModal />)}>
                  Import memories from screenshots
                </Button>
              )}
            </div>
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
