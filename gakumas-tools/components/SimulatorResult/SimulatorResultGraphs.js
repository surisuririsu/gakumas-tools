import { memo, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import {
  AiOutlineAreaChart,
  AiOutlineBarChart,
  AiOutlineBoxPlot,
} from "react-icons/ai";
import ButtonGroup from "@/components/ButtonGroup";
import { AreaPlot, BoxPlot, DistributionPlot } from "@/components/Charts";
import styles from "./SimulatorResult.module.scss";

const HISTOGRAM = <AiOutlineBarChart />;
const BOXPLOT = <AiOutlineBoxPlot />;
const AREA = <AiOutlineAreaChart />;

function SimulatorResultGraphs({ data, plan }) {
  const t = useTranslations("SimulatorResultGraphs");

  const [graphType, setGraphType] = useState("histogram");
  const label = `${t("score")} (n=${data.scores.length})`;
  const boxPlotLabels = useMemo(() => [label], [label]);
  const boxPlotData = useMemo(
    () => [{ label, data: [data.scores] }],
    [label, data.scores]
  );

  return (
    <div>
      <div data-export-hide="true">
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
      </div>
      {graphType == "histogram" && (
        <DistributionPlot
          label={label}
          data={data.bucketedScores}
          bucketSize={data.bucketSize}
          highlight={data.medianScore}
        />
      )}
      {graphType == "boxplot" && (
        <BoxPlot labels={boxPlotLabels} data={boxPlotData} showXAxis={false} />
      )}
      {graphType == "area" && <AreaPlot data={data.graphData} plan={plan} />}
    </div>
  );
}

export default memo(SimulatorResultGraphs);
