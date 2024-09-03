"use client";
import { memo, useContext } from "react";
import { useSession } from "next-auth/react";
import AutoSizer from "react-virtualized-auto-sizer";
import { FixedSizeList as List } from "react-window";
import { FaPen } from "react-icons/fa6";
import Button from "@/components/Button";
import MemoryEditorModal from "@/components/MemoryEditorModal";
import MemoryImporterModal from "@/components/MemoryImporterModal";
import MemorySummary from "@/components/MemorySummary";
import DataContext from "@/contexts/DataContext";
import ModalContext from "@/contexts/ModalContext";
import styles from "./Memories.module.scss";

function MemoriesList({
  memories,
  action,
  selectedMemories,
  setSelectedMemories,
  onPick,
}) {
  const { status } = useSession();
  const { uploadMemories, memoriesLoading } = useContext(DataContext);
  const { setModal } = useContext(ModalContext);

  const Row = ({ index, style }) => {
    const memory = memories[index];
    return (
      <div className={styles.memoryTile} style={style}>
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
        <MemorySummary
          memory={memory}
          action={action}
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
        <div className={styles.nudge}>
          {status == "unauthenticated" && (
            <Button
              style="primary"
              onClick={() => setModal(<MemoryEditorModal />)}
            >
              <FaPen /> メモリーを作成する
            </Button>
          )}
          {status == "authenticated" && !memoriesLoading && (
            <Button
              style="primary"
              onClick={() =>
                setModal(<MemoryImporterModal onSuccess={uploadMemories} />)
              }
            >
              スクショからメモリーを読み取る
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export default memo(MemoriesList);
