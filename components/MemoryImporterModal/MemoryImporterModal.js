"use client";
import { memo, useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FaCheck } from "react-icons/fa6";
import { createWorker } from "tesseract.js";
import Modal from "@/components/Modal";
import {
  getSignatureSkillCardsImageData,
  getNonSignatureSkillCardsImageData,
  getPItemsImageData,
  getMemoryFromFile,
} from "@/utils/imageProcessing/memory";
import styles from "./MemoryImporterModal.module.scss";

const MAX_WORKERS = 8;

function MemoryImporterModal({ onSuccess }) {
  const [total, setTotal] = useState("?");
  const [progress, setProgress] = useState(null);
  const engWorkersRef = useRef();
  const jpnWorkersRef = useRef();
  const signatureSkillCardsImageData = useRef();
  const nonSignatureSkillCardsImageData = useRef();
  const itemImageData = useRef();

  useEffect(() => {
    let numWorkers = 1;
    if (navigator.hardwareConcurrency) {
      numWorkers = Math.ceil(
        Math.min(navigator.hardwareConcurrency, MAX_WORKERS) / 2
      );
    }

    engWorkersRef.current = [];
    for (let i = 0; i < numWorkers; i++) {
      engWorkersRef.current.push(createWorker("eng", 1));
    }

    jpnWorkersRef.current = [];
    for (let i = 0; i < numWorkers; i++) {
      jpnWorkersRef.current.push(createWorker("jpn", 1));
    }

    signatureSkillCardsImageData.current = getSignatureSkillCardsImageData();
    nonSignatureSkillCardsImageData.current =
      getNonSignatureSkillCardsImageData();
    itemImageData.current = getPItemsImageData();

    return () => {
      engWorkersRef.current?.forEach(async (worker) =>
        (await worker).terminate()
      );
      jpnWorkersRef.current?.forEach(async (worker) =>
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

    const entityImageData = {
      signatureSkillCards: await signatureSkillCardsImageData.current,
      nonSignatureSkillCards: await nonSignatureSkillCardsImageData.current,
      pItems: await itemImageData.current,
    };

    let results = [];
    const batchSize = engWorkersRef.current.length;
    for (let i = 0; i < files.length; i += batchSize) {
      const batch = files.slice(i, i + batchSize);
      const promises = batch.map(async (file, j) => {
        const engWorker = await engWorkersRef.current[
          j % engWorkersRef.current.length
        ];
        const jpnWorker = await jpnWorkersRef.current[
          j % jpnWorkersRef.current.length
        ];
        const memory = await getMemoryFromFile(
          file,
          engWorker,
          jpnWorker,
          entityImageData
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
      <h3>Import memories from screenshots</h3>
      <div className={styles.help}>
        <Image
          src="/memory_importer_reference.png"
          width={152}
          height={360}
          alt=""
        />

        <div>
          <p>
            Contest power, parameters, p-items, and skill card icons must be
            visible in each screenshot.
          </p>
          <p>
            Importing may take several seconds or minutes depending on the
            number of memories imported and your device&apos;s processor and
            memory. Your browser may crash if you try to import too many
            memories at once. The recommended limit is 50 memories per batch.
            Use on a smartphone is not recommended.
          </p>
          <p>
            Some memories may fail to parse correctly, and require fixing after
            import. In such cases, they will be marked with &quot;(FIXME)&quot;
            in the name.
          </p>
        </div>
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
    </Modal>
  );
}

export default memo(MemoryImporterModal);
