import { SkillCards } from "gakumas-data";
import PreviewSkillCard from "./PreviewSkillCard";
import styles from "./Preview.styles";

export default function PreviewSkillCardGroup({
  cards,
  customizationGroup,
  idolId,
  baseUrl,
  isEmpty,
}) {
  return (
    <div style={styles.cardGroup}>
      <div style={styles.row}>
        {cards
          .slice(0, 6)
          .map(SkillCards.getById)
          .map((card, index) => (
            <PreviewSkillCard
              key={index}
              card={card}
              customizations={customizationGroup?.[index]}
              idolId={idolId}
              baseUrl={baseUrl}
            />
          ))}
      </div>
      {!isEmpty && (
        <div style={styles.cardCost}>
          Cost:{" "}
          {cards
            .slice(0, 6)
            .filter((id) => id)
            .map(SkillCards.getById)
            .reduce(
              (acc, cur) =>
                acc + (cur.sourceType == "pIdol" ? 0 : cur.contestPower),
              0
            )}
        </div>
      )}
    </div>
  );
}
