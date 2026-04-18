import { memo, useCallback, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FaCircleArrowUp } from "react-icons/fa6";
import ButtonGroup from "@/components/ButtonGroup";
import SimulatorLogs from "@/components/SimulatorLogs";
import SimulatorStats from "@/components/SimulatorStats";
import { logEvent } from "@/utils/logging";
import SimulatorResultGraphs from "./SimulatorResultGraphs";
import styles from "./SimulatorResult.module.scss";
import KofiAd from "../KofiAd";

const TABS = ["stats", "logs"];
const TAB_STORAGE_KEY = "simulatorResultTab";

function SimulatorResult({ data, idolId, plan }) {
  const t = useTranslations("SimulatorResult");
  // Default rendered during SSR / pre-hydration. Hydrated from localStorage
  // in the effect below so the initial markup matches between server and
  // client (avoids hydration mismatch warnings).
  const [tab, setTabState] = useState("stats");

  useEffect(() => {
    try {
      const saved = localStorage.getItem(TAB_STORAGE_KEY);
      if (saved && TABS.includes(saved)) setTabState(saved);
    } catch {
      // localStorage unavailable (e.g. privacy mode) — just stick with default.
    }
  }, []);

  const setTab = useCallback((value) => {
    setTabState(value);
    try {
      localStorage.setItem(TAB_STORAGE_KEY, value);
    } catch {
      // storage full / blocked — persistence degrades, tab still works.
    }
    logEvent("simulator_tab_switch", { tab: value });
  }, []);

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

      <div className={styles.footer}>
        <KofiAd />
        <a className={styles.toTop} href="#simulator_loadout">
          Top
          <FaCircleArrowUp />
        </a>
      </div>
    </div>
  );
}

export default memo(SimulatorResult);
