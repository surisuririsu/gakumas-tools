import { useContext, useState } from "react";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import {
  FaS,
  FaCalculator,
  FaBook,
  FaFilm,
  FaPen,
  FaTrophy,
} from "react-icons/fa6";
import Button from "@/components/Button";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import styles from "./Navbar.module.scss";

const WIDGET_NAMES = {
  produceRankCalculator: (
    <>
      <FaS />
      <FaCalculator />
    </>
  ),
  dex: <FaBook />,
  loadoutEditor: (
    <>
      <FaTrophy />
      <FaPen />
    </>
  ),
  memoryEditor: (
    <>
      <FaFilm />
      <FaPen />
    </>
  ),
  memories: <FaFilm />,
};

export default function Navbar() {
  const { openWidgets, toggle } = useContext(WorkspaceContext);
  const { data: session, status } = useSession();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <nav className={styles.navbar}>
      <h1>Gakumas Tools (In Dev)</h1>
      <div className={styles.links}>
        {Object.keys(WIDGET_NAMES).map((widget) => (
          <button
            key={widget}
            className={openWidgets[widget] ? styles.active : ""}
            onClick={() => toggle(widget)}
          >
            {WIDGET_NAMES[widget]}
          </button>
        ))}
      </div>
      {status == "unauthenticated" ? (
        <Button onClick={() => signIn("discord")}>Sign in with Discord</Button>
      ) : (
        <>
          <button
            className={styles.avatar}
            onClick={() => setShowMenu(!showMenu)}
          >
            {status == "authenticated" && (
              <Image
                src={session.user.image}
                fill
                alt=""
                sizes="32px"
                draggable={false}
              />
            )}
          </button>
          {showMenu && (
            <div className={styles.menu}>
              <Button onClick={() => signOut()}>Sign out</Button>
            </div>
          )}
        </>
      )}
    </nav>
  );
}
