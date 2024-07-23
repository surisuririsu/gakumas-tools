import { useContext } from "react";
import Image from "next/image";
import { PItems, SkillCards } from "gakumas-data";
import PIdol from "@/components/PIdol";
import MemoryContext from "@/contexts/MemoryContext";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { calculateContestPower } from "@/utils/contestPower";
import styles from "./MemorySummary.module.scss";

export default function MemorySummary({ memory }) {
  const { setName, setPIdolId, setParams, setPItemIds, setSkillCardIds } =
    useContext(MemoryContext);
  const { setShowMemoryEditor } = useContext(WorkspaceContext);
  const { name, pIdolId, params, pItemIds, skillCardIds } = memory;
  const contestPower = calculateContestPower(params, pItemIds, skillCardIds);

  function editMemory() {
    setName(name);
    setPIdolId(pIdolId);
    setParams(params);
    setPItemIds(pItemIds);
    setSkillCardIds(skillCardIds);
    setShowMemoryEditor(true);
  }

  return (
    <button className={styles.memorySummary} onClick={editMemory}>
      <PIdol pIdolId={pIdolId} />
      <div className={styles.details}>
        <span className={styles.text}>
          <span>{name}</span>
          <span>{contestPower}</span>
        </span>
        <div className={styles.row}>
          {pItemIds
            .filter((p) => !!p)
            .map(PItems.getById)
            .map((pItem) => (
              <Image src={pItem.icon} width={32} />
            ))}
        </div>
        <div className={styles.row}>
          {skillCardIds
            .filter((s) => !!s)
            .map(SkillCards.getById)
            .map((skillCard) => (
              <Image src={skillCard.icon} width={48} />
            ))}
        </div>
      </div>
    </button>
  );
}
