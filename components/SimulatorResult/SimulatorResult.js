import { memo } from "react";
import SimulatorLogs from "@/components/SimulatorLogs";
import SimulatorResultGraphs from "./SimulatorResultGraphs";
import styles from "./SimulatorResult.module.scss";

function SimulatorResult({ data, idolId }) {
  return (
    <div id="simulator_result" className={styles.result}>
      <table className={styles.stats}>
        <thead>
          <tr>
            <th>Min</th>
            <th>Average</th>
            <th>Max</th>
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

      <label>ログ</label>
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
