import Image from "next/image";
import { useSession, signIn } from "next-auth/react";
import Button from "@/components/Button";
import styles from "./Navbar.module.scss";

export default function Navbar() {
  const { data: session, status } = useSession();
  return (
    <nav className={styles.navbar}>
      <h1>Gakumas Tools</h1>
      <div className={styles.links}></div>
      {status == "authenticated" && (
        <div className={styles.avatar}>
          <Image src={session.user.image} fill alt="" sizes="48px" />
        </div>
      )}
      {status == "unauthenticated" && (
        <Button onClick={() => signIn("discord")}>Sign in</Button>
      )}
    </nav>
  );
}
