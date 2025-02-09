"use client";
import { memo } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { TOOLS } from "@/utils/tools";
import NavbarLink from "./NavbarLink";
import NavbarMenu from "./NavbarMenu";
import styles from "./Navbar.module.scss";

function Navbar() {
  const t = useTranslations("tools");
  const pathname = usePathname();

  return (
    <nav className={styles.navbar}>
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

      <NavbarMenu />
    </nav>
  );
}

export default memo(Navbar);
