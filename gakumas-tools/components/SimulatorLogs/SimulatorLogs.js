import { memo, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { FaCircleArrowUp } from "react-icons/fa6";
import ButtonGroup from "@/components/ButtonGroup";
import styles from "./SimulatorLogs.module.scss";
import Logs from "./Logs";

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

  if (logs) {
    let i = 0;
    let inTurn = false;

    function getLogGroup() {
      let group = [];
      while (i < logs.length) {
        const log = logs[i];
        if (log.logType == "entityStart") {
          i++;
          const childLogs = getLogGroup();
          group.push({ logType: "group", entity: log.data, childLogs });
          i++;
        } else if (log.logType == "entityEnd") {
          return group;
        } else if (log.logType == "startTurn") {
          if (inTurn) {
            inTurn = false;
            return group;
          }
          inTurn = true;
          i++;
          const childLogs = getLogGroup();
          group.push({ logType: "turn", data: log.data, childLogs });
        } else {
          group.push(log);
          i++;
        }
      }
      return group;
    }

    structuredLogs = getLogGroup();
  }

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
