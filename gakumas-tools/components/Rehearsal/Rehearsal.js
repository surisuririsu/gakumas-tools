"use client";
import {
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
import ProgressBar from "@/components/ProgressBar";
import Table from "@/components/Table";
import { downloadBlob } from "@/utils/download";
import {
  getScoresFromFile,
  getScoresFromImage,
} from "@/utils/imageProcessing/rehearsal";
import {
  extractCandidateFrames,
  canvasToImage,
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

  const [total, setTotal] = useState(null);
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

  const parseCsvFile = useCallback(async (file) => {
    const text = await file.text();
    return text
      .trim()
      .split("\n")
      .map((line) => {
        const row = line.split(",").map(Number);
        return [row.slice(0, 3), row.slice(3, 6), row.slice(6, 9)];
      });
  }, []);

  const processVideo = useCallback(
    async (videoFile) => {
      setProcessingStatus(t("analyzingVideo"));
      const candidateFrames = await extractCandidateFrames(videoFile, 200, 180);
      setProcessingStatus(
        t("foundCandidates", { count: candidateFrames.length })
      );

      const workers = workersRef.current;
      const batchSize = workers.length;
      const results = [];
      for (let start = 0; start < candidateFrames.length; start += batchSize) {
        const batch = candidateFrames.slice(start, start + batchSize);
        setProcessingStatus(
          t("readingScores", {
            start: start + 1,
            end: start + batch.length,
            total: candidateFrames.length,
          })
        );
        const batchResults = await Promise.all(
          batch.map(async (canvas, j) => {
            const worker = await workers[j % workers.length];
            const img = await canvasToImage(canvas);
            const scores = await getScoresFromImage(img, worker);
            return scores && scores.length === 3 ? scores : null;
          })
        );
        for (const scores of batchResults) {
          if (scores) results.push(scores);
        }
      }
      setProcessingStatus(t("videoComplete", { count: results.length }));
      return results;
    },
    [t]
  );

  const processImages = useCallback(async (imageFiles) => {
    const workers = workersRef.current;
    const batchSize = workers.length;
    const results = [];
    let failures = 0;
    for (let i = 0; i < imageFiles.length; i += batchSize) {
      const batch = imageFiles.slice(i, i + batchSize);
      const batchResults = await Promise.all(
        batch.map(async (file, j) => {
          const worker = await workers[j % workers.length];
          try {
            return await getScoresFromFile(file, worker);
          } catch (err) {
            console.error(`Error parsing ${file.name}:`, err);
            return null;
          } finally {
            setProgress((p) => p + 1);
          }
        })
      );
      for (const scores of batchResults) {
        if (scores) results.push(scores);
        else failures++;
      }
    }
    return { results, failures };
  }, []);

  const handleFiles = useCallback(
    async (e) => {
      const files = Array.from(e.target.files);
      setProgress(null);
      setProcessingStatus("");
      if (!files.length) return;
      setData([]);
      setTotal(files.length);
      setProgress(0);

      const csvFiles = [];
      const videoFiles = [];
      const imageFiles = [];
      for (const f of files) {
        if (f.type === "text/csv" || f.name.endsWith(".csv")) {
          csvFiles.push(f);
        } else if (
          f.type.startsWith("video/") ||
          /\.(mp4|mov|avi|mkv|webm)$/i.test(f.name)
        ) {
          videoFiles.push(f);
        } else {
          imageFiles.push(f);
        }
      }

      console.time("All results parsed");
      const results = [];

      // CSVs are parsed synchronously and don't use the OCR worker pool, so
      // run them alongside the video/image OCR work.
      const csvPromise = Promise.all(csvFiles.map(parseCsvFile)).then(
        (perFile) => {
          for (const rows of perFile) results.push(...rows);
          setProgress((p) => p + csvFiles.length);
        }
      );

      // Videos and images share the OCR worker pool, so they must run
      // sequentially to avoid contention on the same workers.
      const ocrPromise = (async () => {
        for (const videoFile of videoFiles) {
          try {
            const videoResults = await processVideo(videoFile);
            results.push(...videoResults);
          } catch (err) {
            console.error(`Error processing ${videoFile.name}:`, err);
            setProcessingStatus(t("videoError", { message: err.message }));
          }
          setProgress((p) => p + 1);
        }
        if (imageFiles.length) {
          const { results: imgResults, failures } = await processImages(
            imageFiles
          );
          results.push(...imgResults);
          if (failures) {
            setProcessingStatus(t("imageError", { count: failures }));
          }
        }
      })();

      await Promise.all([csvPromise, ocrPromise]);
      console.timeEnd("All results parsed");
      setData(results);
    },
    [parseCsvFile, processVideo, processImages, t]
  );

  function download() {
    const csvData = data
      .map((row) => row.map((stage) => stage.join(",")).join(","))
      .join("\n");
    const blob = new Blob([csvData], { type: "text/csv" });
    downloadBlob(blob, "rehearsal_data.csv");
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
          <div className={styles.progressLabel}>
            <span>
              {processingStatus ||
                t("progress", { progress, total: total ?? "?" })}
            </span>
            {progress === total && <FaCheck />}
          </div>
          {total > 0 && <ProgressBar value={progress} max={total} />}
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
              <Table
                className={styles.stats}
                headers={[
                  tRes("min"),
                  tRes("average"),
                  tRes("median"),
                  tRes("max"),
                ]}
                rows={[
                  [
                    selectedData.min,
                    selectedData.average,
                    selectedData.median,
                    selectedData.max,
                  ],
                ]}
              />
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
