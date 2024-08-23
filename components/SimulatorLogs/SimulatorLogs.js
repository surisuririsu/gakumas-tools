import { memo, useState } from "react";
import { FaCircleArrowUp } from "react-icons/fa6";
import ButtonGroup from "@/components/ButtonGroup";
import styles from "./SimulatorLogs.module.scss";
import Logs from "./Logs";

function SimulatorLogs({ minRun, averageRun, maxRun, idolId }) {
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
        options={[
          { value: "min", label: "Min" },
          { value: "average", label: "Average" },
          { value: "max", label: "Max" },
        ]}
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
