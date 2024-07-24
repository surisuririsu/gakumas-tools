import { useContext } from "react";
import { useSession, signIn } from "next-auth/react";
import { FaCheck } from "react-icons/fa6";
import Button from "@/components/Button";
import MemoryContext from "@/contexts/MemoryContext";
import styles from "./MemorySave.module.scss";

export default function MemorySave() {
  const { status } = useSession();
  const { id, save, saveState } = useContext(MemoryContext);

  return (
    <div className={styles.save}>
      {status == "unauthenticated" && (
        <Button onClick={() => signIn("discord")}>
          Sign in with Discord to save
        </Button>
      )}
      {status == "authenticated" && (
        <>
          <Button onClick={() => save(false)} disabled={saveState == "saving"}>
            Save
          </Button>
          {id && (
            <Button onClick={() => save(true)} disabled={saveState == "saving"}>
              Save as new
            </Button>
          )}
        </>
      )}
      {saveState == "saving" && "Saving..."}
      {saveState == "saved" && (
        <>
          Saved <FaCheck />
        </>
      )}
    </div>
  );
}
