import { memo, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FaCircleArrowUp } from "react-icons/fa6";
import ButtonGroup from "@/components/ButtonGroup";
import { structureLogs } from "@/utils/simulator";
import Logs from "./Logs";
import styles from "./SimulatorLogs.module.scss";

function SimulatorLogs({ minRun, averageRun, maxRun, idolId }) {
  const t = useTranslations("SimulatorResult");

  const OPTIONS = useMemo(
    () =>
      ["min", "average", "max"].map((value) => ({
        value,
        label: t(value),
      })),
    [t]
  );

  const [runToShow, setRunToShow] = useState("average");

  let logs, structuredLogs;
  if (runToShow == "min") {
    logs = minRun.logs;
  } else if (runToShow == "average") {
    logs = averageRun.logs;
  } else if (runToShow == "max") {
    logs = maxRun.logs;
  }

  structuredLogs = structureLogs(logs);

  return (
    <div className={styles.simulatorLogs}>
      <ButtonGroup
        selected={runToShow}
        options={OPTIONS}
        onChange={(value) => setRunToShow(value == runToShow ? null : value)}
      />

      {structuredLogs && <Logs logs={structuredLogs} idolId={idolId} />}

      <a className={styles.toTop} href="#simulator_loadout">
        Top
        <FaCircleArrowUp />
      </a>
    </div>
  );
}

export default memo(SimulatorLogs);
