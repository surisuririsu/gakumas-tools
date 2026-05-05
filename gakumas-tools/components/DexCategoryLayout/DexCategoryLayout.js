"use client";
import { useMemo } from "react";
import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import { useRouter, usePathname } from "@/i18n/routing";
import c from "@/utils/classNames";
import styles from "./DexCategoryLayout.module.scss";

function DexCategoryLayout({ basePath, tabs, wide, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Dex");

  const currentTab =
    tabs.find((tab) => pathname.startsWith(`${basePath}/${tab}`)) || null;

  const options = useMemo(
    () => tabs.map((tab) => ({ value: tab, label: t(`tabs.${tab}`) })),
    [tabs, t],
  );

  return (
    <div className={c(styles.layout, wide && styles.wide)}>
      <div className={styles.content}>{children}</div>
      {tabs.length > 1 && currentTab && (
        <div className={styles.tabs}>
          <ButtonGroup
            options={options}
            selected={currentTab}
            onChange={(val) => router.push(`${basePath}/${val}`)}
          />
        </div>
      )}
    </div>
  );
}

export default DexCategoryLayout;
