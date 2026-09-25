"use client";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import { OSHI_PROPS } from "@/components/Oshi/config";
import ToolHeader from "@/components/ToolHeader";
import c from "@/utils/classNames";
import { TOOLS } from "@/utils/tools";
import NavbarLink, { PendingReporter } from "./NavbarLink";
import NavbarMenu from "./NavbarMenu";
import styles from "./Navbar.module.scss";

// Width of the underline relative to the link itself (60% = matches the old
// `left: 20%; right: 20%` styling).
const INDICATOR_FRACTION = 0.6;

// Only loaded when a banner is configured.
const Oshi = dynamic(() => import("@/components/Oshi"));

function Navbar() {
  const t = useTranslations("tools");
  const pathname = usePathname();
  const [pendingPath, setPendingPath] = useState(null);
  const activePath = pendingPath || pathname;
  const linksRef = useRef(null);
  const [indicator, setIndicator] = useState({
    left: 0,
    width: 0,
    visible: false,
  });

  useEffect(() => {
    const container = linksRef.current;
    if (!container) return;

    const measure = () => {
      const activeEl = container.querySelector(`.${styles.active}`);
      if (!activeEl) {
        setIndicator((prev) => ({ ...prev, visible: false }));
        return;
      }
      const width = activeEl.offsetWidth * INDICATOR_FRACTION;
      const left = activeEl.offsetLeft + (activeEl.offsetWidth - width) / 2;
      setIndicator((prev) => ({
        left,
        width,
        visible: true,
        appearing: !prev.visible,
      }));
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(container);
    return () => observer.disconnect();
  }, [activePath]);

  const handlePendingChange = useCallback((path, pending) => {
    setPendingPath((cur) => (pending ? path : cur == path ? null : cur));
  }, []);

  return (
    <>
      <nav className={c(styles.navbar, OSHI_PROPS && styles.hasOshi)}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandPrimary}>Gakumas</span>
          <span className={styles.brandSecondary}>Tools</span>
          <PendingReporter path="/" onPendingChange={handlePendingChange} />
        </Link>

        <div className={styles.links} ref={linksRef}>
          {Object.keys(TOOLS).map((key) => (
            <NavbarLink
              key={key}
              icon={TOOLS[key].icon}
              path={TOOLS[key].path}
              title={t(`${key}.title`)}
              active={activePath.startsWith(TOOLS[key].path)}
              onPendingChange={handlePendingChange}
            />
          ))}
          <div
            className={c(
              styles.indicator,
              indicator.appearing && styles.appearing,
              pendingPath && pendingPath != pathname && styles.pending
            )}
            style={{
              transform: `translateX(${indicator.left}px)`,
              width: `${indicator.width}px`,
              opacity: indicator.visible ? 1 : 0,
            }}
            aria-hidden="true"
          />
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
