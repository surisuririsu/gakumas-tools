import { useTranslations } from "next-intl";
import styles from "./EntityIcon.module.scss";
import c from "@/utils/classNames";

export default function TierIndicator({ skillCard }) {
  const t = useTranslations("EntityIcon");
  if (skillCard.sourceType != "produce") return null;
  if (!["R", "SR"].includes(skillCard.rarity)) return null;
  return (
    <div className={c(styles.tier, styles[skillCard.rarity])}>
      {skillCard.unlockPlv > 2 ? t("high") : t("low")}
    </div>
  );
}
