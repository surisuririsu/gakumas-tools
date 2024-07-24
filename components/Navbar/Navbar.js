import { useContext } from "react";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import Button from "@/components/Button";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import styles from "./Navbar.module.scss";

const WIDGET_NAMES = {
  produceRankCalculator: "Produce Rank Calculator",
  dex: "Index",
  memoryEditor: "Memory Editor",
  memories: "Memories",
};

export default function Navbar() {
  const { openWidgets, toggle } = useContext(WorkspaceContext);
  const { data: session, status } = useSession();
  return (
    <nav className={styles.navbar}>
      <h1>Gakumas Tools</h1>
      <div className={styles.links}>
        {Object.keys(WIDGET_NAMES).map((widget) => (
          <a
            key={widget}
            className={openWidgets[widget] ? styles.active : ""}
            onClick={() => toggle(widget)}
          >
            {WIDGET_NAMES[widget]}
          </a>
        ))}
      </div>
      {status == "unauthenticated" ? (
        <Button onClick={() => signIn("discord")}>Sign in with Discord</Button>
      ) : (
        <div className={styles.avatar}>
          {status == "authenticated" && (
            <Image src={session.user.image} fill alt="" sizes="32px" />
          )}
        </div>
      )}
    </nav>
  );
}
