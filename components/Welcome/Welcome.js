import { useContext, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { FaCheck, FaFilm, FaPen } from "react-icons/fa6";
import Button from "@/components/Button";
import MemoryImporter from "@/components/MemoryImporter";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import styles from "./Welcome.module.scss";

export default function Welcome() {
  const { toggle } = useContext(WorkspaceContext);
  const { status } = useSession();
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
        <h3>Current features</h3>
        <ul>
          <li>Calculate required exam score for produce ranks</li>
          <li>View skill card and p-item information</li>
          <li>Save and load memories, import memories from screenshots</li>
          <li>Search memories by skill cards and p-items</li>
        </ul>
        <h3>Planned features</h3>
        <ul>
          <li>
            Create contest loadouts and find matching combinations of memories
          </li>
          <li>Simulate contest stage with loadouts</li>
          <li>
            Find ideal loadouts based on contest stage parameters and items
          </li>
          <li>And more</li>
        </ul>
      </div>
      {showImporter && (
        <MemoryImporter onClose={() => setShowImporter(false)} />
      )}
    </div>
  );
}
