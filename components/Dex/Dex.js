import { useContext, useState } from "react";
import { PIdols, PItems, SkillCards } from "gakumas-data";
import ButtonGroup from "@/components/ButtonGroup";
import Checkbox from "@/components/Checkbox";
import PItem from "@/components/PItem";
import SkillCard from "@/components/SkillCard";
import MemoryContext from "@/contexts/MemoryContext";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { comparePItems, compareSkillCards } from "@/utils/sort";
import styles from "./Dex.module.scss";

export default function Dex() {
  const { showMemoryEditor } = useContext(WorkspaceContext);
  const { pIdolId } = useContext(MemoryContext);
  const [activeTab, setActiveTab] = useState("Skill cards");
  const [filter, setFilter] = useState(showMemoryEditor && pIdolId);

  let skillCards = [];
  let pItems = [];

  if (activeTab == "Skill cards") {
    if (showMemoryEditor && filter && pIdolId) {
      const pIdol = PIdols.getById(pIdolId);
      const signatureSkillCards = SkillCards.getFiltered({
        pIdolIds: [pIdolId],
      });
      const nonSignatureSkillCards = SkillCards.getFiltered({
        rarities: ["R", "SR", "SSR"],
        plans: [pIdol.plan, "free"],
        sourceTypes: ["produce", "support"],
      }).sort(compareSkillCards);
      skillCards = signatureSkillCards.concat(nonSignatureSkillCards);
    } else {
      skillCards = SkillCards.getAll().sort(compareSkillCards);
    }
  } else if (activeTab == "P-items") {
    if (showMemoryEditor && filter && pIdolId) {
      const pIdol = PIdols.getById(pIdolId);
      const signaturePItems = PItems.getFiltered({
        pIdolIds: [pIdolId],
      });
      const nonSignaturePItems = PItems.getFiltered({
        rarities: ["R", "SR", "SSR"],
        plans: [pIdol.plan, "free"],
        sourceTypes: ["produce", "support"],
      }).sort(comparePItems);
      pItems = signaturePItems.concat(nonSignaturePItems);
    } else {
      pItems = PItems.getAll().sort(comparePItems);
    }
  }

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
            <SkillCard key={skillCard.id} skillCardId={skillCard.id} small />
          ))}
        {activeTab === "P-items" &&
          pItems.map((pItem) => <PItem key={pItem.id} pItemId={pItem.id} />)}
      </div>
    </div>
  );
}
