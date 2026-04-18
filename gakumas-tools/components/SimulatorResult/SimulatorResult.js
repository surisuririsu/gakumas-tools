import { memo, useState } from "react";
import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import SimulatorLogs from "@/components/SimulatorLogs";
import SimulatorStats from "@/components/SimulatorStats";
import SimulatorResultGraphs from "./SimulatorResultGraphs";
import styles from "./SimulatorResult.module.scss";
import KofiAd from "../KofiAd";

const TABS = ["stats", "logs"];

function SimulatorResult({ data, idolId, plan }) {
  const t = useTranslations("SimulatorResult");
  const [tab, setTab] = useState("stats");

  return (
    <div id="simulator_result" className={styles.result}>
      <table className={styles.stats}>
        <thead>
          <tr>
            <th>{t("min")}</th>
            <th>{t("average")}</th>
            <th>{t("median")}</th>
            <th>{t("max")}</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>{data.minRun.score}</td>
            <td>{data.averageScore}</td>
            <td>{data.medianScore}</td>
            <td>{data.maxRun.score}</td>
          </tr>
        </tbody>
      </table>

      <SimulatorResultGraphs data={data} plan={plan} />

      <ButtonGroup
        options={TABS.map((value) => ({ value, label: t(value) }))}
        selected={tab}
        onChange={setTab}
      />

      {tab === "logs" && (
        <SimulatorLogs
          minRun={data.minRun}
          averageRun={data.averageRun}
          maxRun={data.maxRun}
          idolId={idolId}
        />
      )}

      {tab === "stats" && (
        <SimulatorStats
          cardUsage={data.cardUsage}
          scoreStats={data.scoreStats}
        />
      )}

      <KofiAd />
    </div>
  );
}

export default memo(SimulatorResult);
