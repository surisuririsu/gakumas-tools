"use client";
import React, {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { useTranslations } from "next-intl";
import { FaCheck, FaDownload, FaFileCsv, FaFileImage } from "react-icons/fa6";
import { createWorker } from "tesseract.js";
import BoxPlot from "@/components/BoxPlot";
import Button from "@/components/Button";
import Image from "@/components/Image";
import { getScoresFromFile } from "@/utils/imageProcessing/rehearsal";
import RehearsalTable from "./RehearsalTable";
import styles from "./Rehearsal.module.scss";
import KofiAd from "../KofiAd";
import DistributionPlot from "../DistributionPlot";
import { bucketScores } from "@/utils/simulator";

const MAX_WORKERS = 8;

function Rehearsal() {
  const t = useTranslations("Rehearsal");
  const tRes = useTranslations("SimulatorResult");

  const [total, setTotal] = useState("?");
  const [progress, setProgress] = useState(null);
  const [data, setData] = useState([]);
  const [selected, setSelected] = useState(null);
  const workersRef = useRef();

  useEffect(() => {
    let numWorkers = 1;
    if (navigator.hardwareConcurrency) {
      numWorkers = Math.min(navigator.hardwareConcurrency, MAX_WORKERS);
    }

    workersRef.current = [];
    for (let i = 0; i < numWorkers; i++) {
      workersRef.current.push(createWorker("eng", 1));
    }

    return () =>
      workersRef.current?.forEach(async (worker) => (await worker).terminate());
  }, []);

  const handleFiles = useCallback(async (e) => {
    // Get files and reset progress
    const files = Array.from(e.target.files);
    setProgress(null);
    if (!files.length) return;
    setData([]);
    setTotal(files.length);
    setProgress(0);

    const csvFiles = files.filter(
      (f) => f.type === "text/csv" || f.name.endsWith(".csv")
    );
    const imageFiles = files.filter((f) => !csvFiles.includes(f));

    let results = [];

    if (csvFiles.length) {
      for (const file of csvFiles) {
        const text = await file.text();
        const rows = text
          .trim()
          .split("\n")
          .map((line) => line.split(",").map(Number));
        const parsed = rows.map((row) => [
          row.slice(0, 3),
          row.slice(3, 6),
          row.slice(6, 9),
        ]);
        results = results.concat(parsed);
      }
      setData(results);
      setProgress(csvFiles.length);
      return;
    }

    if (!imageFiles.length) return;
    console.time("All results parsed");

    const batchSize = workersRef.current.length;
    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);
      const promises = batch.map(async (file, j) => {
        const worker = await workersRef.current[j % workersRef.current.length];
        const scores = await getScoresFromFile(file, worker);
        setProgress((p) => p + 1);
        return scores;
      });
      const res = await Promise.all(promises);
      results = results.concat(res);
    }

    console.timeEnd("All results parsed");
    setData(results);
  }, []);

  function download() {
    let csvData = data
      .map((row) => row.map((stage) => stage.join(",")).join(","))
      .join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "rehearsal_data.csv";
    a.click();
  }

  const boxPlotData = useMemo(
    () =>
      data.reduce(
        (acc, cur) => {
          for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
              if (cur[i]?.[j]) acc[j].data[i].push(cur[i][j]);
            }
          }
          return acc;
        },
        [{ data: [[], [], []] }, { data: [[], [], []] }, { data: [[], [], []] }]
      ),
    [data]
  );

  const selectedData = useMemo(() => {
    if (selected == null) return null;
    const scores = boxPlotData[selected % 3].data[Math.floor(selected / 3)];
    let median = null;
    if (scores.length) {
      const sorted = [...scores].sort((a, b) => a - b);
      const mid = Math.floor(scores.length / 2);
      if (scores.length % 2 === 0) {
        median = Math.round((sorted[mid - 1] + sorted[mid]) / 2);
      } else {
        median = Math.round(sorted[mid]);
      }
    }

    const { bucketedScores, bucketSize } = bucketScores(scores);

    return {
      scores,
      bucketedScores,
      bucketSize,
      min: Math.min(...scores),
      average: Math.round(
        scores.reduce((acc, cur) => acc + cur, 0) / scores.length
      ),
      median,
      max: Math.max(...scores),
    };
  }, [selected, boxPlotData]);

  return (
    <div className={styles.rehearsal}>
      <div className={styles.help}>
        <Image
          src="/rehearsal_parser_reference.png"
          width={120}
          height={120}
          alt=""
        />
        <p>
          {t("addScreenshots")}
          <br />
          <br />
          {t("accuracyNotGuaranteed")}
        </p>
      </div>
      <label htmlFor="input" className={styles.uploadLabel}>
        <FaFileImage />
        <FaFileCsv />
      </label>
      <input
        className={styles.files}
        type="file"
        id="input"
        multiple
        accept="image/*,.csv,text/csv"
        onChange={handleFiles}
        style={{ display: "none" }}
      />

      {progress != null && (
        <div className={styles.progress}>
          Progress: {progress}/{total} {progress == total && <FaCheck />}
        </div>
      )}

      {!!data.length && (
        <>
          <Button style="blue" onClick={download}>
            <FaDownload /> CSV
          </Button>

          <BoxPlot
            labels={[0, 1, 2].map(
              (i) => t("stage", { n: i + 1 }) + ` (n=${data.length})`
            )}
            data={boxPlotData}
            showLegend={false}
          />

          {selected !== null && (
            <div className={styles.statsWrapper}>
              <table className={styles.stats}>
                <thead>
                  <tr>
                    <th>{tRes("min")}</th>
                    <th>{tRes("average")}</th>
                    <th>{tRes("median")}</th>
                    <th>{tRes("max")}</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>{selectedData.min}</td>
                    <td>{selectedData.average}</td>
                    <td>{selectedData.median}</td>
                    <td>{selectedData.max}</td>
                  </tr>
                </tbody>
              </table>
              <DistributionPlot
                label={`${t("score")} (n=${selectedData.scores.length})`}
                data={selectedData.bucketedScores}
                bucketSize={selectedData.bucketSize}
                color="rgba(68, 187, 255, 0.75)"
              />
            </div>
          )}
          <div className={styles.tableWrapper}>
            <RehearsalTable
              data={data}
              selected={selected}
              onChartClick={(x) => setSelected(x == selected ? null : x)}
              onRowDelete={(i) => setData((d) => d.filter((_, j) => j !== i))}
            />
          </div>
        </>
      )}

      <div className={styles.ad}>
        <KofiAd />
      </div>
    </div>
  );
}

export default memo(Rehearsal);
