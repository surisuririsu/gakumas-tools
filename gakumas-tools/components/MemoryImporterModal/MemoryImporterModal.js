"use client";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import { FaCheck } from "react-icons/fa6";
import { useTranslations } from "next-intl";
import { createWorker } from "tesseract.js";
import * as ort from "onnxruntime-web";
import Image from "@/components/Image";
import Modal from "@/components/Modal";
import { getMemoryFromFile } from "@/utils/imageProcessing/memory";
import styles from "./MemoryImporterModal.module.scss";

const MAX_WORKERS = 1;

function MemoryImporterModal({ onSuccess, multiple = true }) {
  const t = useTranslations("MemoryImporterModal");

  const [total, setTotal] = useState("?");
  const [progress, setProgress] = useState(null);
  const engWorkersRef = useRef();

  useEffect(() => {
    let numWorkers = 1;
    if (navigator.hardwareConcurrency) {
      numWorkers = Math.ceil(
        Math.min(navigator.hardwareConcurrency, MAX_WORKERS)
      );
    }

    engWorkersRef.current = [];
    for (let i = 0; i < numWorkers; i++) {
      engWorkersRef.current.push(createWorker("eng", 1));
    }

    return () => {
      engWorkersRef.current?.forEach(async (worker) =>
        (await worker).terminate()
      );
    };
  }, []);

  const handleFiles = useCallback(async (e) => {
    // Get files and reset progress
    const files = Array.from(e.target.files);
    setProgress(null);
    if (!files.length) return;
    setTotal(files.length);
    setProgress(0);

    console.time("All memories parsed");

    const pItemSession = await ort.InferenceSession.create(
      "/p_item_model.onnx"
    );
    const pItemEmbeddings = await fetch("/p_item_embeddings.json").then((r) =>
      r.json()
    );

    const skillCardSession = await ort.InferenceSession.create(
      "/skill_card_model.onnx"
    );
    const skillCardEmbeddings = await fetch("/skill_card_embeddings.json").then(
      (r) => r.json()
    );

    let results = [];
    const batchSize = engWorkersRef.current.length;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const promises = batch.map(async (file, j) => {
        const engWorker = await engWorkersRef.current[
          j % engWorkersRef.current.length
        ];

        const memory = await getMemoryFromFile(
          file,
          engWorker,
          pItemSession,
          pItemEmbeddings,
          skillCardSession,
          skillCardEmbeddings
        );
        setProgress((p) => p + 1);
        return memory;
      });

      const res = await Promise.all(promises);
      results = results.concat(res);
    }

    console.timeEnd("All memories parsed");
    onSuccess(results);
  }, []);

  return (
    <Modal>
      <h3>{t("importMemories")}</h3>
      <div className={styles.help}>
        <Image
          src="/memory_importer_reference.jpg"
          width={178}
          height={360}
          alt=""
        />

        <div>
          {t.rich("instructions", {
            p: (chunks) => <p>{chunks}</p>,
          })}
        </div>
      </div>

      <input
        className={styles.files}
        type="file"
        id="input"
        multiple={multiple}
        accept="image/*"
        onChange={handleFiles}
      />

      {progress != null && (
        <div className={styles.progress}>
          {t("progress", {
            progress,
            total,
          })}{" "}
          {progress == total && <FaCheck />}
        </div>
      )}
    </Modal>
  );
}

export default memo(MemoryImporterModal);
