"use client";
import { memo, useEffect, useRef, useState } from "react";
import Image from "next/image";
import { FaCheck } from "react-icons/fa6";
import { PItems, SkillCards } from "gakumas-data";
import { createWorker } from "tesseract.js";
import Modal from "@/components/Modal";
import { calculateContestPower } from "@/utils/contestPower";
import {
  getBlackCanvas,
  getWhiteCanvas,
  loadImageFromFile,
} from "@/utils/imageProcessing";
import {
  extractPower,
  extractParams,
  extractCards,
  extractItems,
  getSignatureSkillCardsImageData,
  getNonSignatureSkillCardsImageData,
  getPItemsImageData,
} from "@/utils/imageProcessing/memory";
import styles from "./MemoryImporterModal.module.scss";

const MAX_WORKERS = 4;

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
      numWorkers = Math.min(navigator.hardwareConcurrency, MAX_WORKERS);
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

  async function handleFiles(e) {
    // Get files and reset progress
    const files = Array.from(e.target.files);
    setProgress(null);
    if (!files.length) return;
    setTotal(files.length);
    setProgress(0);

    console.time("All memories parsed");

    const promises = files.map((file, i) =>
      loadImageFromFile(file).then(async (img) => {
        const blackCanvas = getBlackCanvas(img);
        const whiteCanvas = getWhiteCanvas(img);

        const engWorker = await engWorkersRef.current[
          i % engWorkersRef.current.length
        ];
        const jpnWorker = await jpnWorkersRef.current[
          i % jpnWorkersRef.current.length
        ];

        const engWhitePromise = engWorker.recognize(whiteCanvas);
        const engBlackPromise = engWorker.recognize(blackCanvas);
        const jpnBlackPromise = jpnWorker.recognize(blackCanvas);

        const powerCandidates = extractPower(await engWhitePromise);
        const params = extractParams(await engBlackPromise);

        const items = extractItems(
          await jpnBlackPromise,
          img,
          blackCanvas,
          await itemImageData.current
        );
        const itemsPIdolId = items
          .filter((c) => !!c)
          .map(PItems.getById)
          .find((item) => item.pIdolId)?.pIdolId;

        const cards = extractCards(
          await jpnBlackPromise,
          img,
          blackCanvas,
          await signatureSkillCardsImageData.current,
          await nonSignatureSkillCardsImageData.current,
          itemsPIdolId
        );
        const cardsPIdolId = cards
          .filter((c) => !!c)
          .map(SkillCards.getById)
          .find((card) => card.pIdolId)?.pIdolId;

        // Pad items and cards to fixed number
        while (items.length < 3) {
          items.push(0);
        }
        while (cards.length < 6) {
          cards.push(0);
        }

        // Calculate contest power and flag those that are mismatched with the screenshot
        const calculatedPower = calculateContestPower(params, items, cards);
        const flag =
          !powerCandidates.includes(calculatedPower) ||
          itemsPIdolId != cardsPIdolId;

        const memory = {
          name: `${Math.max(...powerCandidates, 0)}${flag ? " (FIXME)" : ""}`,
          pIdolId: cardsPIdolId,
          params,
          pItemIds: items,
          skillCardIds: cards,
        };

        setProgress((p) => p + 1);
        return memory;
      })
    );

    Promise.all(promises).then(async (res) => {
      console.timeEnd("All memories parsed");
      onSuccess(res);
    });
  }

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
