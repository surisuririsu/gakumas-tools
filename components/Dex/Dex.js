"use client";
import { useState } from "react";
import ButtonGroup from "@/components/ButtonGroup";
import EntityBank from "@/components/EntityBank";
import EntityDetails from "@/components/EntityDetails";
import { EntityTypes } from "@/utils/entities";
import styles from "./Dex.module.scss";

export default function Dex() {
  const [activeTab, setActiveTab] = useState("スキルカード");
  const [selectedEntity, setSelectedEntity] = useState(null);

  const type =
    activeTab == "スキルカード" ? EntityTypes.SKILL_CARD : EntityTypes.P_ITEM;

  return (
    <div className={styles.dex}>
      <EntityDetails type={selectedEntity?.type} id={selectedEntity?.id} />

      <EntityBank
        type={type}
        onClick={({ id }) => setSelectedEntity({ type, id })}
        includeNull={false}
      />

      <div className={styles.tabs}>
        <ButtonGroup
          selected={activeTab}
          options={["スキルカード", "Pアイテム"]}
          onChange={setActiveTab}
        />
      </div>
    </div>
  );
}
