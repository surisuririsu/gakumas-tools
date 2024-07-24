import { useContext } from "react";
import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import { FaCalculator, FaBook, FaBrain, FaPenToSquare } from "react-icons/fa6";
import Button from "@/components/Button";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import styles from "./Navbar.module.scss";

const WIDGET_NAMES = {
  produceRankCalculator: <FaCalculator />,
  dex: <FaBook />,
  memoryEditor: (
    <>
      <FaBrain />
      <FaPenToSquare />
    </>
  ),
  memories: <FaBrain />,
};

export default function Navbar() {
  const { openWidgets, toggle } = useContext(WorkspaceContext);
  const { data: session, status } = useSession();
  return (
    <nav className={styles.navbar}>
      <h1>Gakumas Tools (In Dev)</h1>
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
