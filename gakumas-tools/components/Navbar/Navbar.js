"use client";
import { memo } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import Oshi from "@/components/Oshi";
import ToolHeader from "@/components/ToolHeader";
import c from "@/utils/classNames";
import { OSHI_PROPS } from "@/utils/oshi";
import { TOOLS } from "@/utils/tools";
import NavbarLink from "./NavbarLink";
import NavbarMenu from "./NavbarMenu";
import styles from "./Navbar.module.scss";

function Navbar() {
  const t = useTranslations("tools");
  const pathname = usePathname();

  return (
    <>
      <nav className={c(styles.navbar, OSHI_PROPS && styles.hasOshi)}>
        <Link href="/">
          <h1>Gakumas Tools</h1>
        </Link>

        <div className={styles.links}>
          {Object.keys(TOOLS).map((key) => (
            <NavbarLink
              key={key}
              icon={TOOLS[key].icon}
              path={TOOLS[key].path}
              title={t(`${key}.title`)}
              active={pathname.startsWith(TOOLS[key].path)}
            />
          ))}
        </div>
        <div className={styles.right}>
          <ToolHeader />
          <NavbarMenu />
        </div>
      </nav>
      {OSHI_PROPS && <Oshi {...OSHI_PROPS} />}
    </>
  );
}

export default memo(Navbar);
