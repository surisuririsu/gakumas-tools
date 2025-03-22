import { useTranslations } from "next-intl";
import styles from "./EntityIcon.module.scss";
import c from "@/utils/classNames";

const TIERED_RARITIES = ["R", "SR"];

export default function TierIndicator({ skillCard }) {
  const t = useTranslations("EntityIcon");
  if (skillCard.sourceType != "produce") return null;
  if (!TIERED_RARITIES.includes(skillCard.rarity)) return null;
  const tier = skillCard.unlockPlv > 2 ? "high" : "low";
  return (
    <div
      className={c(
        styles.badge,
        styles.tier,
        styles[tier],
        styles[skillCard.rarity]
      )}
    >
      {t(tier)}
    </div>
  );
}
