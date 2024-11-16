import { useState } from "react";
import { useTranslations } from "next-intl";
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

export default function SimulatorResultGraphs({ data, plan }) {
  const t = useTranslations("SimulatorResultGraphs");

  const [graphType, setGraphType] = useState("histogram");
  const label = `${t("score")} (n=${NUM_RUNS})`;

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
        <DistributionPlot label={label} data={data.bucketedScores} />
      )}
      {graphType == "boxplot" && (
        <BoxPlot
          labels={[label]}
          data={[{ label, data: [data.scores] }]}
          showXAxis={false}
        />
      )}
      {graphType == "area" && <AreaPlot data={data.graphData} plan={plan} />}
    </div>
  );
}
