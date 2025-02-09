import { memo } from "react";
import { SkillCards } from "gakumas-data";
import gkImg from "gakumas-images";
import Image from "@/components/Image";
import styles from "./SimulatorLogs.module.scss";

function AddCard({ id, idolId, text }) {
  const skillCard = SkillCards.getById(id);
  return (
    <div className={styles.drawCard}>
      {text}
      <Image
        src={gkImg(skillCard, idolId).icon}
        width={24}
        height={24}
        alt=""
      />
      {skillCard.name}
    </div>
  );
}

export default memo(AddCard);
