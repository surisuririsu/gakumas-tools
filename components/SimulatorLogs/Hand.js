import Image from "next/image";
import { SkillCards } from "gakumas-data";
import styles from "./SimulatorLogs.module.scss";

export default function Hand({ handCardIds, scores, selectedCardId, idolId }) {
  const selectedIndex = handCardIds.indexOf(selectedCardId);
  return (
    <div className={styles.hand}>
      {handCardIds.map(SkillCards.getById).map((skillCard, i) => (
        <div className={styles.handCard}>
          <div className={i == selectedIndex ? styles.selected : ""}>
            <Image
              src={skillCard.getDynamicIcon(idolId)}
              width={60}
              height={60}
              alt=""
            />
          </div>
          {skillCard.name}
          <span className={styles.cardScore}>{scores[i]}</span>
        </div>
      ))}
    </div>
  );
}
