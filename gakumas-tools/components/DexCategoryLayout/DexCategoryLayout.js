"use client";
import { useContext, useMemo } from "react";
import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import NavigationGuardContext, {
  NavigationGuardProvider,
} from "@/contexts/NavigationGuardContext";
import { useRouter, usePathname } from "@/i18n/routing";
import c from "@/utils/classNames";
import styles from "./DexCategoryLayout.module.scss";

function DexCategoryLayoutInner({ basePath, tabs, wide, children }) {
  const pathname = usePathname();
  const router = useRouter();
  const t = useTranslations("Dex");
  const { runGuard } = useContext(NavigationGuardContext);

  const currentTab =
    tabs.find((tab) => pathname.startsWith(`${basePath}/${tab}`)) || null;

  const options = useMemo(
    () => tabs.map((tab) => ({ value: tab, label: t(`tabs.${tab}`) })),
    [tabs, t],
  );

  const handleTabChange = async (val) => {
    if (await runGuard()) {
      router.push(`${basePath}/${val}`);
    }
  };

  return (
    <div className={c(styles.layout, wide && styles.wide)}>
      {tabs.length > 1 && currentTab && (
        <div className={styles.tabs}>
          <ButtonGroup
            options={options}
            selected={currentTab}
            onChange={handleTabChange}
          />
        </div>
      )}
      <div className={styles.content}>{children}</div>
    </div>
  );
}

function DexCategoryLayout(props) {
  return (
    <NavigationGuardProvider>
      <DexCategoryLayoutInner {...props} />
    </NavigationGuardProvider>
  );
}

export default DexCategoryLayout;
