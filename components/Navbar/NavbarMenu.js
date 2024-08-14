"use client";
import { memo, useState } from "react";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import Button from "@/components/Button";
import styles from "./Navbar.module.scss";

const discordSignIn = () => signIn("discord");

function NavbarMenu() {
  const { data: session, status } = useSession();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.menu}>
      {status == "unauthenticated" && (
        <Button onClick={discordSignIn}>Sign in with Discord</Button>
      )}
      {status == "authenticated" && (
        <button
          className={styles.avatar}
          onClick={() => setExpanded(!expanded)}
        >
          <Image
            src={session.user.image}
            alt=""
            fill
            sizes="32px"
            draggable={false}
          />
        </button>
      )}
      {expanded && (
        <div className={styles.dropdown}>
          <Button onClick={signOut}>Sign out</Button>
        </div>
      )}
    </div>
  );
}

export default memo(NavbarMenu);
