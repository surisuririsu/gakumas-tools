import DistributionPlot from "@/components/DistributionPlot";
import SimulatorLogs from "@/components/SimulatorLogs";
import styles from "./SimulatorResult.module.scss";

export default function SimulatorResult({ data, idolId }) {
  return (
    <div className={styles.result}>
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

      <b>
        This feature is in development. Simulator behavior differs from the real
        game.
      </b>
      <b>このプログラムは開発中のものです。ゲーム内のAIと挙動が異なります。</b>

      <label>Logs</label>
      <SimulatorLogs
        minRun={data.minRun}
        averageRun={data.averageRun}
        maxRun={data.maxRun}
        idolId={idolId}
      />
    </div>
  );
}
