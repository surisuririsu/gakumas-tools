import { useContext, useState } from "react";
import { PItems, SkillCards } from "gakumas-data";
import ButtonGroup from "@/components/ButtonGroup";
import Checkbox from "@/components/Checkbox";
import PItem from "@/components/PItem";
import SkillCard from "@/components/SkillCard";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { comparePItems, compareSkillCards } from "@/utils/sort";
import styles from "./Dex.module.scss";

export default function Dex() {
  const { showMemoryEditor } = useContext(WorkspaceContext);
  const [activeTab, setActiveTab] = useState("Skill cards");
  const [filter, setFilter] = useState(showMemoryEditor);
  const skillCards = SkillCards.getAll().sort(compareSkillCards);
  const pItems = PItems.getAll().sort(comparePItems);

  return (
    <div className={styles.dex}>
      <div className={styles.tabs}>
        <ButtonGroup
          selected={activeTab}
          options={["Skill cards", "P-items"]}
          onChange={setActiveTab}
        />
      </div>
      {showMemoryEditor && (
        <div className={styles.filter}>
          <Checkbox label="Filter" checked={filter} onChange={setFilter} />
        </div>
      )}

      <div className={styles.result}>
        {activeTab === "Skill cards" &&
          skillCards.map((skillCard) => (
            <SkillCard key={skillCard.id} skillCardId={skillCard.id} />
          ))}
        {activeTab === "P-items" &&
          pItems.map((pItem) => <PItem key={pItem.id} pItemId={pItem.id} />)}
      </div>
    </div>
  );
}
