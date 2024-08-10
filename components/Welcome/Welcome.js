import { useContext, useState } from "react";
import { useSession, signIn } from "next-auth/react";
import { FaCheck, FaFilm, FaPen } from "react-icons/fa6";
import Button from "@/components/Button";
import MemoryImporter from "@/components/MemoryImporter";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { WIDGETS } from "@/utils/widgets";
import styles from "./Welcome.module.scss";

export default function Welcome() {
  const { status } = useSession();
  const { open } = useContext(WorkspaceContext);
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

        <h3>Features</h3>
        <ul>
          {Object.keys(WIDGETS).map((widget) => {
            const { title, icon, description } = WIDGETS[widget];
            return (
              <li key={widget} className={styles.feature}>
                <Button onClick={() => open(widget)}>{icon}</Button>
                {description}
              </li>
            );
          })}
        </ul>
      </div>

      {showImporter && (
        <MemoryImporter onClose={() => setShowImporter(false)} />
      )}
    </div>
  );
}
