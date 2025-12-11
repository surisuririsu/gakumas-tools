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
import {
  FaCheck,
  FaDownload,
  FaFileCsv,
  FaFileImage,
  FaVideo,
} from "react-icons/fa6";
import { createWorker } from "tesseract.js";
import BoxPlot from "@/components/BoxPlot";
import Button from "@/components/Button";
import Image from "@/components/Image";
import {
  getScoresFromFile,
  getScoresFromImage,
} from "@/utils/imageProcessing/rehearsal";
import {
  extractFramesFromVideo,
  canvasToImage,
  getAverageBrightness,
} from "@/utils/imageProcessing/videoFrameExtractor";
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
  const [processingStatus, setProcessingStatus] = useState("");
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
    setProcessingStatus("");
    if (!files.length) return;
    setData([]);
    setTotal(files.length);
    setProgress(0);

    const csvFiles = files.filter(
      (f) => f.type === "text/csv" || f.name.endsWith(".csv")
    );
    const videoFiles = files.filter(
      (f) =>
        f.type.startsWith("video/") || /\.(mp4|mov|avi|mkv|webm)$/i.test(f.name)
    );
    const imageFiles = files.filter(
      (f) => !csvFiles.includes(f) && !videoFiles.includes(f)
    );

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

    if (!imageFiles.length && !videoFiles.length) return;
    console.time("All results parsed");

    if (videoFiles.length) {
      for (const videoFile of videoFiles) {
        try {
          console.log(`Processing video: ${videoFile.name}`);
          setProcessingStatus(`Extracting frames from video...`);
          const frames = await extractFramesFromVideo(videoFile, 200);
          console.log(`Extracted ${frames.length} frames from video`);
          setProcessingStatus(`Analyzing ${frames.length} frames...`);

          const brightnesses = frames.map((frame, i) => {
            const brightness = getAverageBrightness(frame);
            console.log(`Frame ${i}: brightness = ${brightness.toFixed(1)}`);
            return brightness;
          });

          const candidateFrames = [];
          for (let i = 0; i < frames.length - 1; i++) {
            const currentBrightness = brightnesses[i];
            const nextBrightness = brightnesses[i + 1];

            if (currentBrightness < 180 && nextBrightness > 180) {
              console.log(
                `Frame ${i}: Detected transition to loading screen (brightness: ${currentBrightness.toFixed(
                  1
                )} -> ${nextBrightness.toFixed(1)})`
              );
              candidateFrames.push(i);
            }
          }

          console.log(`Found ${candidateFrames.length} candidate frames.`);

          setProcessingStatus(
            `Found ${candidateFrames.length} potential rehearsal results. Reading scores...`
          );

          const batchSize = workersRef.current.length;
          let processedCount = 0;

          for (
            let batchStart = 0;
            batchStart < candidateFrames.length;
            batchStart += batchSize
          ) {
            const batchEnd = Math.min(
              batchStart + batchSize,
              candidateFrames.length
            );
            const batch = candidateFrames.slice(batchStart, batchEnd);

            setProcessingStatus(
              `Reading scores (${processedCount + 1}-${
                processedCount + batch.length
              }/${candidateFrames.length})...`
            );

            const batchPromises = batch.map(async (frameIndex, j) => {
              const worker = await workersRef.current[
                j % workersRef.current.length
              ];

              for (let i = 0; i < 5; i++) {
                const indexToProcess = frameIndex - i;
                if (indexToProcess < 0) continue;

                const img = await canvasToImage(frames[indexToProcess]);
                const scores = await getScoresFromImage(img, worker);

                if (scores && scores.length === 3) {
                  console.log(
                    `Frame ${indexToProcess}: Found valid result: ${scores
                      .flat()
                      .join(",")}`
                  );
                  return scores;
                }
              }
              return null;
            });

            const batchResults = await Promise.all(batchPromises);

            for (const scores of batchResults) {
              if (scores && scores.length === 3) {
                results.push(scores);
              }
            }

            processedCount += batch.length;
          }

          console.log(`Found ${results.length} rehearsal results in video`);
          setProcessingStatus(
            `Completed! Found ${results.length} rehearsal results.`
          );
        } catch (error) {
          console.error(`Error processing video ${videoFile.name}:`, error);
          setProcessingStatus(`Error processing video: ${error.message}`);
        }
        setProgress((p) => p + 1);
      }
    }

    // Process image files
    if (imageFiles.length) {
      const batchSize = workersRef.current.length;
      for (let i = 0; i < imageFiles.length; i += batchSize) {
        const batch = imageFiles.slice(i, i + batchSize);
        const promises = batch.map(async (file, j) => {
          const worker = await workersRef.current[
            j % workersRef.current.length
          ];
          const scores = await getScoresFromFile(file, worker);
          setProgress((p) => p + 1);
          return scores;
        });
        const res = await Promise.all(promises);
        results = results.concat(res);
      }
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
        <FaVideo />
        <FaFileCsv />
      </label>
      <input
        className={styles.files}
        type="file"
        id="input"
        multiple
        accept="image/*,video/*,.csv,text/csv"
        onChange={handleFiles}
        style={{ display: "none" }}
      />

      {progress != null && (
        <div className={styles.progress}>
          {processingStatus ? (
            <>{processingStatus}</>
          ) : (
            <>
              Progress: {progress}/{total} {progress == total && <FaCheck />}
            </>
          )}
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
