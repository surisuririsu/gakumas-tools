import { useContext } from "react";
import Image from "next/image";
import { PItems, SkillCards } from "gakumas-data";
import Button from "@/components/Button";
import PIdol from "@/components/PIdol";
import MemoryContext from "@/contexts/MemoryContext";
import WorkspaceContext from "@/contexts/WorkspaceContext";
import { calculateContestPower } from "@/utils/contestPower";
import styles from "./MemorySummary.module.scss";

export default function MemorySummary({ memory }) {
  const { setAll } = useContext(MemoryContext);
  const { open } = useContext(WorkspaceContext);
  const { name, pIdolId, params, pItemIds, skillCardIds } = memory;
  const contestPower = calculateContestPower(params, pItemIds, skillCardIds);

  function editMemory() {
    setAll(memory);
    open("memoryEditor");
  }

  return (
    <div className={styles.memorySummary}>
      <div className={styles.left}>
        <PIdol pIdolId={pIdolId} />
        <div className={styles.actions}>
          <Button onClick={editMemory}>Edit</Button>
        </div>
      </div>

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
              <Image
                key={pItem.id}
                src={pItem.icon}
                width={32}
                alt={pItem.name}
                draggable={false}
              />
            ))}
        </div>
        <div className={styles.row}>
          {skillCardIds
            .filter((s) => !!s)
            .map(SkillCards.getById)
            .map((skillCard) => (
              <Image
                key={skillCard.id}
                src={skillCard.icon}
                width={48}
                alt={skillCard.name}
                draggable={false}
              />
            ))}
        </div>
      </div>
    </div>
  );
}
