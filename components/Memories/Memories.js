import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import MemorySummary from "@/components/MemorySummary";
import styles from "./Memories.module.scss";

export default function Memories() {
  const { status } = useSession();
  const [memories, setMemories] = useState([]);

  useEffect(() => {
    if (status == "authenticated") {
      async function fetchData() {
        const response = await fetch("/api/memory");
        const data = await response.json();
        setMemories(data.memories);
      }
      fetchData();
    }
  }, []);

  return (
    <div className={styles.memories}>
      {memories.map((memory) => (
        <MemorySummary memory={memory} />
      ))}
    </div>
  );
}
