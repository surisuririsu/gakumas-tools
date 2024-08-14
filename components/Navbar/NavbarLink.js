import { memo } from "react";
import Link from "next/link";
import styles from "./Navbar.module.scss";

function NavbarLink({ path, icon, active }) {
  return (
    <Link
      className={`${styles.link} ${active ? styles.active : ""}`}
      href={`${path}`}
    >
      {icon}
    </Link>
  );
}

export default memo(NavbarLink);
