import { memo, useCallback, useContext, useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { FaCircleArrowUp, FaDownload, FaWandMagicSparkles } from "react-icons/fa6";
import Button from "@/components/Button";
import ButtonGroup from "@/components/ButtonGroup";
import SimulatorLogs from "@/components/SimulatorLogs";
import SimulatorStats from "@/components/SimulatorStats";
import Table from "@/components/Table";
import LoadoutContext from "@/contexts/LoadoutContext";
import { downloadBlob } from "@/utils/download";
import { logEvent } from "@/utils/logging";
import { findOptimalParams } from "@/utils/paramOptimizer";
import SimulatorResultGraphs from "./SimulatorResultGraphs";
import styles from "./SimulatorResult.module.scss";
import KofiAd from "../KofiAd";

const TABS = ["stats", "logs"];
const TAB_STORAGE_KEY = "simulatorResultTab";

function SimulatorResult({ data, config, enterPercents, idolId, plan }) {
  const t = useTranslations("SimulatorResult");
  const { setParams } = useContext(LoadoutContext);
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

  const optimizeParams = useCallback(() => {
    const result = findOptimalParams({
      scoreStats: data.scoreStats,
      config,
      enterPercents,
    });
    if (!result) return;
    setParams((cur) => [
      result.params.vocal,
      result.params.dance,
      result.params.visual,
      cur[3],
    ]);
    logEvent("simulator_params_optimize", {
      gain: Math.round(result.optimalScore - result.baseScore),
    });
  }, [data.scoreStats, config, enterPercents, setParams]);

  const downloadScores = useCallback(() => {
    const blob = new Blob([data.scores.join("\n")], { type: "text/csv" });
    downloadBlob(blob, "simulator_scores.csv");
    logEvent("simulator_scores_download", { count: data.scores.length });
  }, [data.scores]);

  return (
    <div id="simulator_result" className={styles.result}>
      <Table
        className={styles.stats}
        headers={[t("min"), t("average"), t("median"), t("max")]}
        rows={[
          [
            data.minRun.score,
            data.averageScore,
            data.medianScore,
            data.maxRun.score,
          ],
        ]}
      />

      <SimulatorResultGraphs data={data} plan={plan} />

      <div className={styles.actions} data-export-hide="true">
        <Button fill size="sm" onClick={downloadScores}>
          <FaDownload />
          {t("downloadScores")}
        </Button>
        <Button fill size="sm" onClick={optimizeParams}>
          <FaWandMagicSparkles />
          {t("optimizeParams")}
        </Button>
      </div>

      <div className={styles.details} data-export-hide="true">
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
    </div>
  );
}

export default memo(SimulatorResult);
