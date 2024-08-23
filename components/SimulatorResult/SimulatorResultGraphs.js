import { useState } from "react";
import { AiOutlineBarChart, AiOutlineBoxPlot } from "react-icons/ai";
import BoxPlot from "@/components/BoxPlot";
import ButtonGroup from "@/components/ButtonGroup";
import DistributionPlot from "@/components/DistributionPlot";
import { NUM_RUNS } from "@/simulator/constants";
import styles from "./SimulatorResult.module.scss";

const HISTOGRAM = <AiOutlineBarChart />;
const BOXPLOT = <AiOutlineBoxPlot />;

export default function SimulatorResultGraphs({ data }) {
  const [graphType, setGraphType] = useState("histogram");
  return (
    <div className={styles.graphs}>
      <ButtonGroup
        options={[
          { value: "histogram", label: HISTOGRAM },
          { value: "boxplot", label: BOXPLOT },
        ]}
        selected={graphType}
        onChange={setGraphType}
      />
      {graphType == "histogram" && (
        <DistributionPlot data={data.bucketedScores} />
      )}
      {graphType == "boxplot" && (
        <BoxPlot
          labels={[`スコア (n=${NUM_RUNS})`]}
          data={[{ label: `スコア (n=${NUM_RUNS})`, data: [data.scores] }]}
          showXAxis={false}
        />
      )}
    </div>
  );
}
