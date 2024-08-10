import { useContext, useState } from "react";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import Button from "@/components/Button";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { WIDGETS } from "@/utils/widgets";
import styles from "./Navbar.module.scss";

export default function Navbar() {
  const { openWidgets, toggle } = useContext(WorkspaceContext);
  const { data: session, status } = useSession();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <nav className={styles.navbar}>
      <h1>Gakumas Tools (開発中)</h1>

      <div className={styles.links}>
        {Object.keys(WIDGETS).map((widget) => (
          <button
            key={widget}
            className={openWidgets[widget] ? styles.active : ""}
            aria-label={widget.title}
            onClick={() => toggle(widget)}
          >
            {WIDGETS[widget].icon}
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
