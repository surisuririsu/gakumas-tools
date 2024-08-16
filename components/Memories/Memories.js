"use client";
import { memo, useContext, useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Button from "@/components/Button";
import DataContext from "@/contexts/DataContext";
import styles from "./Memories.module.scss";
import MemoriesHeader from "./MemoriesHeader";
import MemoriesList from "./MemoriesList";

function Memories() {
  const { status } = useSession();
  const { memories, fetchMemories } = useContext(DataContext);
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
          <Button onClick={() => signIn("discord")}>
            Sign in with Discord to save/load memories
          </Button>
        </div>
      )}
    </div>
  );
}

export default memo(Memories);
