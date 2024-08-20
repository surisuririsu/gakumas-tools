"use client";
import { memo, useContext, useEffect, useState } from "react";
import { FaPen } from "react-icons/fa6";
import { useSession } from "next-auth/react";
import Button from "@/components/Button";
import MemoryEditorModal from "@/components/MemoryEditorModal";
import DataContext from "@/contexts/DataContext";
import ModalContext from "@/contexts/ModalContext";
import MemoriesHeader from "./MemoriesHeader";
import MemoriesList from "./MemoriesList";
import styles from "./Memories.module.scss";

function Memories() {
  const { status } = useSession();
  const { memories, fetchMemories } = useContext(DataContext);
  const { setModal } = useContext(ModalContext);
  const [action, setAction] = useState(null);
  const [selectedMemories, setSelectedMemories] = useState({});

  useEffect(() => {
    if (status == "authenticated" && !memories.length) {
      fetchMemories();
    }
  }, [status]);

  return (
    <div className={styles.memories}>
      {status == "authenticated" && (
        <>
          <MemoriesHeader
            numMemories={memories.length}
            action={action}
            setAction={setAction}
            selectedMemories={selectedMemories}
            setSelectedMemories={setSelectedMemories}
          />
          <MemoriesList
            memories={memories}
            action={action}
            selectedMemories={selectedMemories}
            setSelectedMemories={setSelectedMemories}
          />
        </>
      )}

      {status == "unauthenticated" && (
        <div className={styles.nudge}>
          <Button onClick={() => setModal(<MemoryEditorModal />)}>
            <FaPen /> Create a memory
          </Button>
        </div>
      )}
    </div>
  );
}

export default memo(Memories);
