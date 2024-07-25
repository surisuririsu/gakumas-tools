import { useContext, useEffect, useState } from "react";
import {
  FaCircleXmark,
  FaMagnifyingGlass,
  FaFileImport,
  FaRegTrashCan,
} from "react-icons/fa6";
import { useSession, signIn } from "next-auth/react";
import Button from "@/components/Button";
import MemoryImporter from "@/components//MemoryImporter";
import MemorySummary from "@/components/MemorySummary";
import DataContext from "@/contexts/DataContext";
import styles from "./Memories.module.scss";

export default function Memories() {
  const { status } = useSession();
  const { memories, fetchMemories } = useContext(DataContext);
  const [action, setAction] = useState(null);

  useEffect(() => {
    if (status == "authenticated") {
      fetchMemories();
    }
  }, [status]);

  return (
    <div className={styles.memories}>
      {status == "authenticated" ? (
        <>
          <div className={styles.header}>
            {action ? (
              <div>
                <button onClick={() => setAction(null)}>
                  <FaCircleXmark />
                </button>
              </div>
            ) : (
              <>
                <button onClick={() => setAction("search")}>
                  <FaMagnifyingGlass />
                </button>
                <button onClick={() => setAction("import")}>
                  <FaFileImport />
                </button>
                <button onClick={() => setAction("delete")}>
                  <FaRegTrashCan />
                </button>
              </>
            )}
            {action == "import" && <MemoryImporter />}
          </div>
          <div className={styles.list}>
            {memories.reverse().map((memory) => (
              <MemorySummary key={memory._id} memory={memory} />
            ))}
          </div>
        </>
      ) : (
        <Button onClick={() => signIn("discord")}>
          Sign in with Discord to show memories
        </Button>
      )}
    </div>
  );
}
