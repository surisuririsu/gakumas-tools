"use client";
import { memo, useCallback, useState } from "react";
import ButtonGroup from "@/components/ButtonGroup";
import EntityBank from "@/components/EntityBank";
import EntityDetails from "@/components/EntityDetails";
import { EntityTypes } from "@/utils/entities";
import styles from "./Dex.module.scss";

function Dex() {
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
          options={[
            { value: EntityTypes.SKILL_CARD, label: "スキルカード" },
            { value: EntityTypes.P_ITEM, label: "Pアイテム" },
          ]}
          onChange={setActiveTab}
        />
      </div>
    </div>
  );
}

export default memo(Dex);
