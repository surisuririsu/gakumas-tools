import { useContext, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { FaCheck, FaFilm, FaPen } from "react-icons/fa6";
import Button from "@/components/Button";
import MemoryImporter from "@/components/MemoryImporter";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import styles from "./Welcome.module.scss";

export default function Welcome() {
  const { toggle } = useContext(WorkspaceContext);
  const { data: session, status } = useSession();
  const [showImporter, setShowImporter] = useState(false);

  return (
    <div className={styles.welcome}>
      <div className={styles.content}>
        <h2>Welcome to Gakumas Tools (In Development)!</h2>
        <p>
          Calculate the exam score required to achieve produce ranks, view
          P-item and skill card information, import and search memories by
          P-items and skill cards, and more.
        </p>
        <h3>Getting started</h3>
        <ul>
          <li>
            <span className={status == "authenticated" ? styles.done : ""}>
              To save and load memories,{" "}
              <Button
                onClick={() => signIn("discord")}
                disabled={status == "authenticated"}
              >
                Sign in with Discord
              </Button>
            </span>
            {status == "authenticated" && <FaCheck />}
          </li>
          <li>
            Add memories by{" "}
            <Button
              onClick={() => setShowImporter(true)}
              disabled={status != "authenticated"}
            >
              Importing screenshots
            </Button>{" "}
            or entering them in the{" "}
            <Button onClick={() => toggle("memoryEditor")}>
              Memory Editor{" "}
              <>
                <FaFilm />
                <FaPen />
              </>
            </Button>
          </li>
        </ul>
      </div>
      {showImporter && (
        <MemoryImporter onClose={() => setShowImporter(false)} />
      )}
    </div>
  );
}
