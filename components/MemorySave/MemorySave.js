import { memo, useContext } from "react";
import { useSession, signIn } from "next-auth/react";
import { FaCheck } from "react-icons/fa6";
import Button from "@/components/Button";
import MemoryContext from "@/contexts/MemoryContext";
import styles from "./MemorySave.module.scss";

function MemorySave() {
  const { status } = useSession();
  const { id, save, saveState } = useContext(MemoryContext);

  return (
    <div className={styles.save}>
      {status == "unauthenticated" && (
        <Button style="primary" onClick={() => signIn("discord")}>
          Sign in with Discord to save
        </Button>
      )}

      {status == "authenticated" && (
        <>
          <Button
            style="primary"
            onClick={() => save(false)}
            disabled={saveState == "saving"}
          >
            保存
          </Button>
          {id && (
            <Button
              style="primary"
              onClick={() => save(true)}
              disabled={saveState == "saving"}
            >
              新規保存
            </Button>
          )}
        </>
      )}

      {saveState == "saved" && <FaCheck />}
    </div>
  );
}

export default memo(MemorySave);
