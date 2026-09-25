import { memo, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import ButtonGroup from "@/components/ButtonGroup";
import c from "@/utils/classNames";
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
  const [switched, setSwitched] = useState(false);

  let logs;
  if (runToShow == "min") {
    logs = minRun.logs;
  } else if (runToShow == "average") {
    logs = averageRun.logs;
  } else if (runToShow == "max") {
    logs = maxRun.logs;
  }

  const structuredLogs = useMemo(() => structureLogs(logs), [logs]);

  return (
    <div className={styles.simulatorLogs}>
      <ButtonGroup
        selected={runToShow}
        options={OPTIONS}
        onChange={(value) => {
          setRunToShow(value == runToShow ? null : value);
          setSwitched(true);
        }}
      />

      {structuredLogs && (
        <div key={runToShow} className={c(switched && styles.enter)}>
          <Logs logs={structuredLogs} idolId={idolId} />
        </div>
      )}
    </div>
  );
}

export default memo(SimulatorLogs);
