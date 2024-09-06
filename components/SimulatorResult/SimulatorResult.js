import { memo } from "react";
import { useTranslations } from "next-intl";
import SimulatorLogs from "@/components/SimulatorLogs";
import SimulatorResultGraphs from "./SimulatorResultGraphs";
import styles from "./SimulatorResult.module.scss";

function SimulatorResult({ data, idolId }) {
  const t = useTranslations("SimulatorResult");

  return (
    <div id="simulator_result" className={styles.result}>
      <table className={styles.stats}>
        <thead>
          <tr>
            <th>{t("min")}</th>
            <th>{t("average")}</th>
            <th>{t("max")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{data.minScore}</td>
            <td>{data.averageScore}</td>
            <td>{data.maxScore}</td>
          </tr>
        </tbody>
      </table>

      <SimulatorResultGraphs data={data} />

      <label>{t("logs")}</label>
      <SimulatorLogs
        minRun={data.minRun}
        averageRun={data.averageRun}
        maxRun={data.maxRun}
        idolId={idolId}
      />
    </div>
  );
}

export default memo(SimulatorResult);
