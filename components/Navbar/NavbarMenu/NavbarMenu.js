"use client";
import { memo, useState } from "react";
import Image from "next/image";
import { useSession, signIn, signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { FaCircleUser } from "react-icons/fa6";
import Button from "@/components/Button";
import { Link, usePathname } from "@/i18n/routing";
import c from "@/utils/classNames";
import styles from "./NavbarMenu.module.scss";

const discordSignIn = () => signIn("discord");

function NavbarMenu() {
  const t = useTranslations("NavbarMenu");

  const locale = useLocale();
  const pathname = usePathname();
  const { data: session, status } = useSession();
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={styles.menu}>
      <button className={styles.avatar} onClick={() => setExpanded(!expanded)}>
        {status == "authenticated" ? (
          <Image
            src={session.user.image}
            alt=""
            fill
            sizes="32px"
            draggable={false}
          />
        ) : (
          <FaCircleUser />
        )}
      </button>

      <div
        className={c(styles.overlay, expanded && styles.expanded)}
        onClick={() => setExpanded(false)}
      >
        <div className={styles.dropdown} onClick={(e) => e.stopPropagation()}>
          {status == "unauthenticated" && (
            <div>
              <Button style="primary" onClick={discordSignIn} fill>
                {t("signInWithDiscord")}
              </Button>
            </div>
          )}

          <a href="https://wikiwiki.jp/gakumas/" target="_blank">
            {t("gakumasContestWiki")}
          </a>

          <a
            href="https://github.com/surisuririsu/gakumas-tools/issues/new"
            target="_blank"
          >
            {t("sendFeedback")}
          </a>

          {locale == "ja" && (
            <Link href={pathname} locale="en" className={styles.lang}>
              English
            </Link>
          )}
          {locale == "en" && (
            <Link href={pathname} locale="ja" className={styles.lang}>
              日本語
            </Link>
          )}

          {status == "authenticated" && (
            <button onClick={signOut}>{t("signOut")}</button>
          )}
        </div>
      </div>
    </div>
  );
}

export default memo(NavbarMenu);
