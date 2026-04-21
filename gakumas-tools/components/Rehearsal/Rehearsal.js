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
import { DEBUG } from "@/utils/imageProcessing/common";
import {
  getScoresFromFile,
  getScoresFromImage,
} from "@/utils/imageProcessing/rehearsal";
import { streamCandidateFrames } from "@/utils/imageProcessing/videoFrameExtractor";
import { bucketScores } from "@/utils/simulator";
import { runBatched } from "@/utils/workerPool";
import KofiAd from "../KofiAd";
import DistributionPlot from "../DistributionPlot";
import RehearsalTable from "./RehearsalTable";
import { bucketFiles, parseCsvFile } from "./rehearsalFiles";
import {
  buildBoxPlotData,
  computeStats,
  scoresForSelected,
} from "./rehearsalStats";
import styles from "./Rehearsal.module.scss";

const MAX_WORKERS = 8;
const FRAME_INTERVAL_MS = 200;
const BRIGHTNESS_THRESHOLD = 180;

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
    const numWorkers = Math.min(
      navigator.hardwareConcurrency || 1,
      MAX_WORKERS,
    );
    workersRef.current = Array.from({ length: numWorkers }, () =>
      createWorker("eng", 1),
    );
    return () => {
      workersRef.current?.forEach(async (w) => (await w).terminate());
    };
  }, []);

  const processVideo = useCallback(
    async (videoFile) => {
      setProcessingStatus(t("analyzingVideo"));
      // Single worker is enough: seeking dominates runtime, OCR is fast, and
      // one-frame-at-a-time streaming keeps peak memory flat (one canvas
      // instead of N candidates on mobile).
      const worker = await workersRef.current[0];
      const results = [];
      let scanStarted = false;
      let lastStatusAt = 0;
      for await (const canvas of streamCandidateFrames(videoFile, {
        intervalMs: FRAME_INTERVAL_MS,
        brightnessThreshold: BRIGHTNESS_THRESHOLD,
        onProgress: (analyzed, frameTotal) => {
          if (!scanStarted) {
            scanStarted = true;
            // The video was initially allocated 1 unit in the total; expand
            // that to `frameTotal` so the progress bar tracks per-frame.
            setTotal((cur) => cur + frameTotal - 1);
          }
          setProgress((p) => p + 1);
          // Throttle status updates to ~4/sec — seeking can fire every
          // ~50ms on desktop.
          const now = performance.now();
          if (now - lastStatusAt < 250 && analyzed !== frameTotal) return;
          lastStatusAt = now;
          setProcessingStatus(
            t("scanningVideo", {
              analyzed,
              total: frameTotal,
              found: results.length,
            }),
          );
        },
      })) {
        const scores = await getScoresFromImage(canvas, worker);
        if (scores && scores.length === 3) results.push(scores);
      }
      setProcessingStatus(t("videoComplete", { count: results.length }));
      return { results, scanStarted };
    },
    [t],
  );

  const processImages = useCallback(async (imageFiles) => {
    const workers = workersRef.current;
    const scored = await runBatched(imageFiles, workers, async (file, worker) => {
      try {
        return await getScoresFromFile(file, worker);
      } catch (err) {
        console.error(`Error parsing ${file.name}:`, err);
        return null;
      } finally {
        setProgress((p) => p + 1);
      }
    });
    const results = scored.filter(Boolean);
    return { results, failures: scored.length - results.length };
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

      const { csvs, videos, images } = bucketFiles(files);
      if (DEBUG) console.time("All results parsed");
      const results = [];

      // CSVs don't use the OCR worker pool, so they run alongside video/image OCR.
      const csvPromise = Promise.all(
        csvs.map((f) =>
          parseCsvFile(f).catch((err) => {
            console.error(`Error parsing CSV ${f.name}:`, err);
            return [];
          }),
        ),
      ).then((perFile) => {
        for (const rows of perFile) results.push(...rows);
        if (csvs.length) setProgress((p) => p + csvs.length);
      });

      // Videos and images share the OCR worker pool, so they run sequentially.
      const ocrPromise = (async () => {
        for (const videoFile of videos) {
          let scanStarted = false;
          try {
            const res = await processVideo(videoFile);
            results.push(...res.results);
            scanStarted = res.scanStarted;
          } catch (err) {
            console.error(`Error processing ${videoFile.name}:`, err);
            setProcessingStatus(t("videoError", { message: err.message }));
          }
          // If the scan never started (loadVideo error), close out the
          // video's 1-unit allocation here. Otherwise per-frame ticking
          // already covered it.
          if (!scanStarted) setProgress((p) => p + 1);
        }
        if (images.length) {
          const { results: imgResults, failures } = await processImages(images);
          results.push(...imgResults);
          if (failures) {
            setProcessingStatus(t("imageError", { count: failures }));
          }
        }
      })();

      await Promise.all([csvPromise, ocrPromise]);
      if (DEBUG) console.timeEnd("All results parsed");
      setData(results);
    },
    [processVideo, processImages, t],
  );

  const download = useCallback(() => {
    const csv = data
      .map((row) => row.map((stage) => stage.join(",")).join(","))
      .join("\n");
    downloadBlob(new Blob([csv], { type: "text/csv" }), "rehearsal_data.csv");
  }, [data]);

  const boxPlotData = useMemo(() => buildBoxPlotData(data), [data]);

  const selectedData = useMemo(() => {
    if (selected == null) return null;
    const scores = scoresForSelected(boxPlotData, selected);
    const stats = computeStats(scores);
    if (!stats) return null;
    const { bucketedScores, bucketSize } = bucketScores(scores);
    return { scores, bucketedScores, bucketSize, ...stats };
  }, [selected, boxPlotData]);

  const handleChartClick = useCallback(
    (x) => setSelected((cur) => (x === cur ? null : x)),
    [],
  );
  const handleRowDelete = useCallback(
    (i) => setData((d) => d.filter((_, j) => j !== i)),
    [],
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
              (i) => t("stage", { n: i + 1 }) + ` (n=${data.length})`,
            )}
            data={boxPlotData}
            showLegend={false}
          />

          {selectedData && (
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
              onChartClick={handleChartClick}
              onRowDelete={handleRowDelete}
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
