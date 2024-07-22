import { useContext } from "react";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import Button from "@/components/Button";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import styles from "./Navbar.module.scss";

export default function Navbar() {
  const {
    showProduceRankCalculator,
    setShowProduceRankCalculator,
    showMemoryEditor,
    setShowMemoryEditor,
    showDex,
    setShowDex,
  } = useContext(WorkspaceContext);
  const { data: session, status } = useSession();
  return (
    <nav className={styles.navbar}>
      <h1>Gakumas Tools</h1>
      <div className={styles.links}>
        <a
          className={showProduceRankCalculator ? styles.active : ""}
          onClick={() =>
            setShowProduceRankCalculator(!showProduceRankCalculator)
          }
        >
          Produce Rank Calculator
        </a>
        <a
          className={showMemoryEditor ? styles.active : ""}
          onClick={() => setShowMemoryEditor(!showMemoryEditor)}
        >
          Memory Editor
        </a>
        <a
          className={showDex ? styles.active : ""}
          onClick={() => setShowDex(!showDex)}
        >
          Index
        </a>
      </div>
      {status == "authenticated" && (
        <div className={styles.avatar}>
          <Image src={session.user.image} fill alt="" sizes="32px" />
        </div>
      )}
      {status == "unauthenticated" && (
        <Button onClick={() => signIn("discord")}>Sign in</Button>
      )}
    </nav>
  );
}
