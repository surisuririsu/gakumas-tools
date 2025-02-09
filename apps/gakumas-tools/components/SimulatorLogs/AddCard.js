import { memo } from "react";
import Image from "@/components/Image";
import { SkillCards } from "@/utils/data";
import styles from "./SimulatorLogs.module.scss";

function AddCard({ id, idolId, text }) {
  const skillCard = SkillCards.getById(id);
  return (
    <div className={styles.drawCard}>
      {text}
      <Image src={skillCard.getIcon(idolId)} width={24} height={24} alt="" />
      {skillCard.name}
    </div>
  );
}

export default memo(AddCard);
