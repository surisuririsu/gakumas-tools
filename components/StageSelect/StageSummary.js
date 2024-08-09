import Image from "next/image";
import styles from "./StageSelect.module.scss";

export default function StageSummary({ stage }) {
  return (
    <>
      {stage.name}
      <Image src={`/plans/${stage.plan}.png`} width={20} height={20} alt="" />
      <div className={styles.status}>
        {Object.values(stage.criteria).map((c, i) => (
          <div key={i} style={{ flex: c }}></div>
        ))}
      </div>
    </>
  );
}
