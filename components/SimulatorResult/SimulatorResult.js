import { memo } from "react";
import DistributionPlot from "@/components/DistributionPlot";
import SimulatorLogs from "@/components/SimulatorLogs";
import styles from "./SimulatorResult.module.scss";

function SimulatorResult({ data, idolId }) {
  return (
    <div id="simulator_result" className={styles.result}>
      <DistributionPlot data={data.buckets} />

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

      {/* <b>
        {" "}
        This feature is in development. Simulator behavior differs from the real
        game.
      </b> */}

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
