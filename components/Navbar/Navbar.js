"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession, signIn, signOut } from "next-auth/react";
import Button from "@/components/Button";
import { TOOLS } from "@/utils/tools";
import styles from "./Navbar.module.scss";

export default function Navbar() {
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [showMenu, setShowMenu] = useState(false);

  return (
    <nav className={styles.navbar}>
      <h1>Gakumas Tools</h1>

      <div className={styles.links}>
        {TOOLS.map(({ icon, path }) => (
          <Link
            key={path}
            className={`${styles.link} ${
              pathname == path ? styles.active : ""
            }`}
            href={`${path}`}
          >
            {icon}
          </Link>
        ))}
      </div>

      <div className={styles.auth}>
        {status == "unauthenticated" ? (
          <Button onClick={() => signIn("discord")}>
            Sign in with Discord
          </Button>
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
      </div>
    </nav>
  );
}
