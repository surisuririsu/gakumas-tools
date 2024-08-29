"use client";
import React, { memo, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FaCheck, FaDownload } from "react-icons/fa6";
import { createWorker } from "tesseract.js";
import BoxPlot from "@/components/BoxPlot";
import Button from "@/components/Button";
import { getWhiteCanvas, loadImageFromFile } from "@/utils/imageProcessing";
import { extractScores } from "@/utils/imageProcessing/rehearsal";
import RehearsalTable from "./RehearsalTable";
import styles from "./Rehearsal.module.scss";

const BATCH_SIZE = 8;
const MAX_WORKERS = 8;

function Rehearsal() {
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

  async function handleFiles(e) {
    // Get files and reset progress
    const files = Array.from(e.target.files);
    setProgress(null);
    if (!files.length) return;
    setData([]);
    setTotal(files.length);
    setProgress(0);

    console.time("All results parsed");

    let results = [];
    for (let i = 0; i < files.length; i += BATCH_SIZE) {
      const batch = files.slice(i, i + BATCH_SIZE);
      const promises = batch.map((file, i) =>
        loadImageFromFile(file).then(async (img) => {
          const whiteCanvas = getWhiteCanvas(img, 190);
          const worker = await workersRef.current[
            i % workersRef.current.length
          ];
          const engWhitePromise = worker.recognize(whiteCanvas);
          const scores = extractScores(await engWhitePromise);

          setProgress((p) => p + 1);
          return scores;
        })
      );
      const res = await Promise.all(promises);
      results = results.concat(res);
    }

    console.timeEnd("All results parsed");
    setData(results);
  }

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

  const boxPlotData = data.reduce(
    (acc, cur) => {
      for (let i = 0; i < 3; i++) {
        for (let j = 0; j < 3; j++) {
          if (cur[i]?.[j]) acc[j].data[i].push(cur[i][j]);
        }
      }
      return acc;
    },
    [{ data: [[], [], []] }, { data: [[], [], []] }, { data: [[], [], []] }]
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
          Add screenshots of the rehearsal result screen to parse scores from.
          <br />
          <br />
          Accuracy is not guaranteed. It is recommended to manually verify the
          results by comparing with your screenshots.
        </p>
      </div>
      <div>
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
      </div>

      {!!data.length && (
        <>
          <Button style="blue" onClick={download}>
            <FaDownload /> CSV
          </Button>
          <BoxPlot
            labels={["ステージ1", "ステージ2", "ステージ3"]}
            data={boxPlotData}
            showLegend={false}
          />
          <div className={styles.tableWrapper}>
            <RehearsalTable data={data} />
          </div>
        </>
      )}
    </div>
  );
}

export default memo(Rehearsal);
