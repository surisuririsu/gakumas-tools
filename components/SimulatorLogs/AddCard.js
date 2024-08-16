import { memo } from "react";
import Image from "next/image";
import { SkillCards } from "gakumas-data";
import styles from "./SimulatorLogs.module.scss";

function AddCard({ id, idolId, text }) {
  const skillCard = SkillCards.getById(id);
  return (
    <div className={styles.drawCard}>
      {text}
      <Image
        src={skillCard.getDynamicIcon(idolId)}
        width={24}
        height={24}
        alt=""
      />
      {skillCard.name}
    </div>
  );
}

export default memo(AddCard);
