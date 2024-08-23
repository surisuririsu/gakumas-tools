import { useState } from "react";
import {
  AiOutlineAreaChart,
  AiOutlineBarChart,
  AiOutlineBoxPlot,
} from "react-icons/ai";
import AreaPlot from "@/components/AreaPlot";
import BoxPlot from "@/components/BoxPlot";
import ButtonGroup from "@/components/ButtonGroup";
import DistributionPlot from "@/components/DistributionPlot";
import { NUM_RUNS } from "@/simulator/constants";
import styles from "./SimulatorResult.module.scss";

const HISTOGRAM = <AiOutlineBarChart />;
const BOXPLOT = <AiOutlineBoxPlot />;
const AREA = <AiOutlineAreaChart />;

export default function SimulatorResultGraphs({ data }) {
  const [graphType, setGraphType] = useState("histogram");

  return (
    <div>
      <ButtonGroup
        className={styles.graphSelect}
        options={[
          { value: "histogram", label: HISTOGRAM },
          { value: "boxplot", label: BOXPLOT },
          { value: "area", label: AREA },
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
      {graphType == "area" && <AreaPlot data={data.graphData} />}
    </div>
  );
}
