"use client";
import { usePathname } from "next/navigation";
import { TOOLS } from "@/utils/tools";
import NavbarLink from "./NavbarLink";
import NavbarMenu from "./NavbarMenu";
import styles from "./Navbar.module.scss";

export default function Navbar() {
  const pathname = usePathname();

  return (
    <nav className={styles.navbar}>
      <h1>Gakumas Tools</h1>

      <div className={styles.links}>
        {Object.values(TOOLS).map(({ icon, path }) => (
          <NavbarLink
            key={path}
            path={path}
            icon={icon}
            active={path == pathname}
          />
        ))}
      </div>

      <NavbarMenu />
    </nav>
  );
}
