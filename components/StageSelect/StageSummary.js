import { memo } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { formatStageName } from "@/utils/stages";
import styles from "./StageSelect.module.scss";

function StageSummary({ stage }) {
  const t = useTranslations("StageSummary");

  return (
    <>
      {formatStageName(stage, t)}
      <Image src={`/plans/${stage.plan}.png`} width={20} height={20} alt="" />
      <div className={styles.status}>
        {Object.values(stage.criteria).map((c, i) => (
          <div key={i} style={{ flex: c * 100 }}></div>
        ))}
      </div>
    </>
  );
}

export default memo(StageSummary);
