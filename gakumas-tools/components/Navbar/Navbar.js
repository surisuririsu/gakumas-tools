"use client";
import { memo, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/routing";
import Oshi, { OSHI_PROPS } from "@/components/Oshi";
import ToolHeader from "@/components/ToolHeader";
import c from "@/utils/classNames";
import { TOOLS } from "@/utils/tools";
import NavbarLink from "./NavbarLink";
import NavbarMenu from "./NavbarMenu";
import styles from "./Navbar.module.scss";

// Width of the underline relative to the link itself (60% = matches the old
// `left: 20%; right: 20%` styling).
const INDICATOR_FRACTION = 0.6;

function Navbar() {
  const t = useTranslations("tools");
  const pathname = usePathname();
  const linksRef = useRef(null);
  const [indicator, setIndicator] = useState({
    left: 0,
    width: 0,
    visible: false,
  });

  // Measure the active link and slide the indicator to match.
  useEffect(() => {
    const container = linksRef.current;
    if (!container) return;

    const measure = () => {
      const activeEl = container.querySelector(`.${styles.active}`);
      if (!activeEl) {
        setIndicator((prev) => ({ ...prev, visible: false }));
        return;
      }
      const containerRect = container.getBoundingClientRect();
      const rect = activeEl.getBoundingClientRect();
      const width = rect.width * INDICATOR_FRACTION;
      const left =
        rect.left - containerRect.left + (rect.width - width) / 2;
      setIndicator({ left, width, visible: true });
    };

    measure();
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, [pathname]);

  return (
    <>
      <nav className={c(styles.navbar, OSHI_PROPS && styles.hasOshi)}>
        <Link href="/" className={styles.brand}>
          <span className={styles.brandPrimary}>Gakumas</span>
          <span className={styles.brandSecondary}>Tools</span>
        </Link>

        <div className={styles.links} ref={linksRef}>
          {Object.keys(TOOLS).map((key) => (
            <NavbarLink
              key={key}
              icon={TOOLS[key].icon}
              path={TOOLS[key].path}
              title={t(`${key}.title`)}
              active={pathname.startsWith(TOOLS[key].path)}
            />
          ))}
          <div
            className={styles.indicator}
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
