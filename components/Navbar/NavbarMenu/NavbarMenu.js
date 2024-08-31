"use client";
import { memo, useState } from "react";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { FaCircleUser, FaGithub, FaXTwitter } from "react-icons/fa6";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import styles from "./NavbarMenu.module.scss";

const discordSignIn = () => signIn("discord");

function NavbarMenu() {
  const { data: session, status } = useSession();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.menu}>
      <button className={styles.avatar} onClick={() => setExpanded(true)}>
        {status == "authenticated" ? (
          <Image
            src={session.user.image}
            alt=""
            width={32}
            height={32}
            draggable={false}
          />
        ) : (
          <FaCircleUser />
        )}
      </button>

      {expanded && (
        <div className={styles.overlay} onClick={() => setExpanded(false)}>
          <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
            {status == "unauthenticated" && (
              <div>
                <Button onClick={discordSignIn} fill>
                  Discordでログイン
                </Button>
              </div>
            )}

            <a href="https://wikiwiki.jp/gakumas/" target="_blank">
              学マスコンテストWiki
            </a>

            <a
              href="https://github.com/surisuririsu/gakumas-tools/issues/new"
              target="_blank"
            >
              フィードバックを送信
            </a>

            <div className={styles.author}>
              <div>Made by risりす</div>
              <div className={styles.socials}>
                <IconButton
                  icon={FaXTwitter}
                  href="https://x.com/surisuririsu"
                  size="small"
                />
                <IconButton
                  icon={FaGithub}
                  href="https://github.com/surisuririsu/gakumas-tools"
                  size="small"
                />
              </div>
              <div className={styles.fine}>
                with research from the Gakumas contest community
              </div>
            </div>

            {status == "authenticated" && (
              <button onClick={signOut}>ログアウト</button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default memo(NavbarMenu);
