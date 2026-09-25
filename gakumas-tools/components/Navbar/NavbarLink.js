import { memo, useEffect } from "react";
import { useLinkStatus } from "next/link";
import { Link } from "@/i18n/routing";
import c from "@/utils/classNames";
import styles from "./Navbar.module.scss";

const TRANSITION_TYPES = ["nav-tool"];

function PendingReporter({ path, onPendingChange }) {
  const { pending } = useLinkStatus();
  useEffect(() => {
    onPendingChange(path, pending);
  }, [path, pending, onPendingChange]);
  return null;
}

function NavbarLink({ icon, path, title, active, onPendingChange }) {
  return (
    <Link
      className={c(styles.link, active && styles.active)}
      href={`${path}`}
      aria-label={title}
      aria-current={active ? "page" : undefined}
      transitionTypes={TRANSITION_TYPES}
    >
      {icon}
      <PendingReporter path={path} onPendingChange={onPendingChange} />
    </Link>
  );
}

export default memo(NavbarLink);
