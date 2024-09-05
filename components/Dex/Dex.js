"use client";
import { memo, useCallback, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import EntityBank from "@/components/EntityBank";
import EntityDetails from "@/components/EntityDetails";
import { EntityTypes } from "@/utils/entities";
import styles from "./Dex.module.scss";

function Dex() {
  const t = useTranslations("Dex");

  const OPTIONS = useMemo(
    () => [
      { value: EntityTypes.SKILL_CARD, label: t("skillCards") },
      { value: EntityTypes.P_ITEM, label: t("pItems") },
    ],
    [t]
  );

  const [activeTab, setActiveTab] = useState(EntityTypes.SKILL_CARD);
  const [selectedEntity, setSelectedEntity] = useState(null);

  const selectEntity = useCallback(
    ({ id }) => setSelectedEntity({ type: activeTab, id }),
    [activeTab]
  );

  return (
    <div className={styles.dex}>
      <EntityDetails type={selectedEntity?.type} id={selectedEntity?.id} />

      <EntityBank type={activeTab} onClick={selectEntity} includeNull={false} />

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
