import { memo } from "react";
import { useTranslations } from "next-intl";
import Image from "@/components/Image";
import { formatStageName, isLatestSeason } from "@/utils/stages";
import styles from "./StageSelect.module.scss";

function StageSummary({ stage }) {
  const t = useTranslations("StageSummary");
  const criteria = Object.values(stage.criteria);

  return (
    <>
      <div className={styles.namePlan}>
        <span className={styles.nameWithIndicator}>
          {isLatestSeason(stage) && (
            <span
              className={styles.activeDot}
              title={t("activeSeason")}
              aria-label={t("activeSeason")}
            />
          )}
          {formatStageName(stage, t)}
        </span>
        <Image src={`/plans/${stage.plan}.png`} width={20} height={20} alt="" />
      </div>
      {criteria.every((c) => c) && (
        <div className={styles.status}>
          {Object.values(stage.criteria).map((c, i) => (
            <div key={i} style={{ flexGrow: c * 100 }}></div>
          ))}
        </div>
      )}
    </>
  );
}

export default memo(StageSummary);
