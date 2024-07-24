import { useContext, useEffect, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import Button from "@/components/Button";
import MemorySummary from "@/components/MemorySummary";
import DataContext from "@/contexts/DataContext";
import styles from "./Memories.module.scss";

export default function Memories() {
  const { status } = useSession();
  const { getMemories } = useContext(DataContext);
  const [memories, setMemories] = useState([]);

  useEffect(() => {
    if (status == "authenticated") {
      async function fetchData() {
        const data = await getMemories();
        setMemories(data);
      }
      fetchData();
    }
  }, [status]);

  return (
    <div className={styles.memories}>
      {status == "authenticated" ? (
        memories.map((memory) => (
          <MemorySummary key={memory._id} memory={memory} />
        ))
      ) : (
        <Button onClick={() => signIn("discord")}>
          Sign in with Discord to show memories
        </Button>
      )}
    </div>
  );
}
