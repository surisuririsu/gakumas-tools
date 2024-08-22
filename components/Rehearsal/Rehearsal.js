"use client";
import React, { memo, useEffect, useRef, useState } from "react";
import { FaCheck, FaDownload } from "react-icons/fa6";
import { default as NextImage } from "next/image";
import { createWorker } from "tesseract.js";
import Button from "@/components/Button";
import { getWhiteCanvas } from "@/utils/imageProcessing";
import { extractScores } from "@/utils/imageProcessing/rehearsal";
import RehearsalTable from "./RehearsalTable";
import styles from "./Rehearsal.module.scss";

function Rehearsal({ onSuccess }) {
  const [total, setTotal] = useState("?");
  const [progress, setProgress] = useState(null);
  const [data, setData] = useState([]);
  const engWorker = useRef();

  useEffect(() => {
    engWorker.current = createWorker("eng", 1);

    return () => {
      engWorker.current?.terminate?.();
    };
  }, []);

  async function handleFiles(e) {
    // Get files and reset progress
    const files = Array.from(e.target.files);
    setProgress(null);
    if (!files.length) return;
    setTotal(files.length);
    setProgress(0);

    console.time("All results parsed");

    const promises = files.map(
      (file) =>
        new Promise((resolve) => {
          const blobURL = URL.createObjectURL(file);
          const img = new Image();
          img.src = blobURL;
          img.onload = async () => {
            const whiteCanvas = getWhiteCanvas(img, 180);

            const engWhitePromise = (await engWorker.current).recognize(
              whiteCanvas
            );

            const scores = extractScores(await engWhitePromise);

            setProgress((p) => p + 1);
            resolve(scores);
          };
        })
    );

    Promise.all(promises).then(async (res) => {
      console.timeEnd("All results parsed");
      setData(res);
    });
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

  return (
    <div className={styles.rehearsal}>
      <label>Parse rehearsal results from screenshots</label>
      <p>
        Accuracy is not guaranteed. It is recommended to manually verify the
        results by comparing with your screenshots.
      </p>
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
          <RehearsalTable data={data} />
        </>
      )}
    </div>
  );
}

export default memo(Rehearsal);
