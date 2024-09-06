import { memo } from "react";
import { Link } from "@/i18n/routing";
import styles from "./Navbar.module.scss";

function NavbarLink({ icon, path, title, active }) {
  return (
    <Link
      className={`${styles.link} ${active ? styles.active : ""}`}
      href={`${path}`}
      aria-label={title}
    >
      {icon}
    </Link>
  );
}

export default memo(NavbarLink);
