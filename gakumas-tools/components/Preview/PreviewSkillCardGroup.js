import { SkillCards } from "gakumas-data";
import { Raised } from "@/components/OgImage/parts";
import { COLORS } from "@/components/OgImage/theme";
import PreviewSkillCard from "./PreviewSkillCard";
import styles from "./Preview.styles";

export default function PreviewSkillCardGroup({
  cards,
  customizationGroup,
  idolId,
  isEmpty,
  imageMap,
}) {
  const cost = cards
    .slice(0, 6)
    .filter((id) => id)
    .map(SkillCards.getById)
    .reduce(
      (acc, cur) => acc + (cur.sourceType == "pIdol" ? 0 : cur.contestPower),
      0,
    );

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
              imageMap={imageMap}
            />
          ))}
      </div>
      {!isEmpty && (
        <div style={styles.row}>
          <Raised radius={999} edge={COLORS.edge} style={styles.costChip}>
            <span>Cost</span>
            <span style={styles.costValue}>{cost.toLocaleString("en")}</span>
          </Raised>
        </div>
      )}
    </div>
  );
}
