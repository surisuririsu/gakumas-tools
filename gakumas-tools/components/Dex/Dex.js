"use client";
import { memo, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import EntityReference from "@/components/EntityReference";
import { EntityTypes } from "@/utils/entities";
import styles from "./Dex.module.scss";

function Dex() {
  const t = useTranslations("Dex");

  const OPTIONS = useMemo(
    () => [
      { value: EntityTypes.SKILL_CARD, label: t("tabs.skill-cards") },
      { value: EntityTypes.P_ITEM, label: t("tabs.p-items") },
      { value: EntityTypes.P_DRINK, label: t("tabs.p-drinks") },
    ],
    [t],
  );

  const [activeTab, setActiveTab] = useState(EntityTypes.SKILL_CARD);

  return (
    <div className={styles.dex}>
      <EntityReference type={activeTab} />

      <div className={styles.tabs}>
        <ButtonGroup
          selected={activeTab}
          options={OPTIONS}
          onChange={setActiveTab}
        />
      </div>
    </div>
  );
}

export default memo(Dex);
