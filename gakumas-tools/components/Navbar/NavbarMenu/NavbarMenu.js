"use client";
import { memo, useState } from "react";
import { useSession, signIn, signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { FaCircleUser, FaGithub, FaXTwitter } from "react-icons/fa6";
import { SiKofi } from "react-icons/si";
import Button from "@/components/Button";
import IconButton from "@/components/IconButton";
import Image from "@/components/Image";
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
      <button
        className={styles.avatar}
        aria-label={t("menu")}
        onClick={() => setExpanded(!expanded)}
      >
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

          <Link href="/">{t("home")}</Link>

          <a href="https://wikiwiki.jp/gakumas/" target="_blank">
            {t("gakumasContestWiki")}
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
              <IconButton
                icon={SiKofi}
                href="https://ko-fi.com/surisuririsu"
                size="small"
              />
            </div>
            <div className={styles.fine}>
              with research from the Gakumas contest community
            </div>
          </div>

          {locale != "en" && (
            <Link href={pathname} locale="en">
              English
            </Link>
          )}
          {locale != "ja" && (
            <Link href={pathname} locale="ja">
              日本語
            </Link>
          )}
          {locale != "zh-Hans" && (
            <Link href={pathname} locale="zh-Hans">
              简体中文
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
