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
import { FaCheck, FaDownload } from "react-icons/fa6";
import { createWorker } from "tesseract.js";
import BoxPlot from "@/components/BoxPlot";
import Button from "@/components/Button";
import Image from "@/components/Image";
import { getScoresFromFile } from "@/utils/imageProcessing/rehearsal";
import RehearsalTable from "./RehearsalTable";
import styles from "./Rehearsal.module.scss";
import KofiAd from "../KofiAd";

const MAX_WORKERS = 8;

function Rehearsal() {
  const t = useTranslations("Rehearsal");

  const [total, setTotal] = useState("?");
  const [progress, setProgress] = useState(null);
  const [data, setData] = useState([]);
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

    console.time("All results parsed");

    let results = [];
    const batchSize = workersRef.current.length;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
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
      <input
        className={styles.files}
        type="file"
        id="input"
        multiple
        onChange={handleFiles}
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
          <div className={styles.tableWrapper}>
            <RehearsalTable data={data} />
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
