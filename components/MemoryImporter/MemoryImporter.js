import { useContext, useState } from "react";
import { default as NextImage } from "next/image";
import { PItems, SkillCards } from "gakumas-data";
import { FaCircleQuestion, FaCheck } from "react-icons/fa6";
import { createWorker } from "tesseract.js";
import IconButton from "@/components/IconButton";
import Modal from "@/components/Modal";
import DataContext from "@/contexts/DataContext";
import { calculateContestPower } from "@/utils/contestPower";
import {
  extractPower,
  extractParams,
  extractCards,
  getBlackCanvas,
  getWhiteCanvas,
  extractItems,
  getSignatureSkillCardsImageData,
  getNonSignatureSkillCardsImageData,
  getPItemsImageData,
} from "@/utils/memoryFromImage";
import styles from "./MemoryImporter.module.scss";

export default function MemoryImporter() {
  const [total, setTotal] = useState("?");
  const [progress, setProgress] = useState(null);
  const [showModal, setShowModal] = useState(null);
  const { fetchMemories } = useContext(DataContext);

  async function handleFiles(e) {
    // Get files and reset progress
    const files = Array.from(e.target.files);
    setProgress(null);
    if (!files.length) return;
    setTotal(files.length);
    setProgress(0);

    // Set up workers and entity image data promises
    let worker;
    const workerPromise = createWorker("eng");
    const signatureSkillCardsImageDataPromise =
      getSignatureSkillCardsImageData();
    const nonSignatureSkillCardsImageDataPromise =
      getNonSignatureSkillCardsImageData();
    const itemImageDataPromise = getPItemsImageData();

    const promises = files.map(
      (file) =>
        new Promise((resolve) => {
          const blobURL = URL.createObjectURL(file);
          const img = new Image();
          img.src = blobURL;
          img.onload = async () => {
            const blackCanvas = getBlackCanvas(img);
            const whiteCanvas = getWhiteCanvas(img);

            worker = await workerPromise;
            const engWhitePromise = worker.recognize(whiteCanvas);
            const engBlackPromise = worker.recognize(blackCanvas);

            const items = extractItems(
              img,
              blackCanvas,
              await itemImageDataPromise
            );
            const itemsPIdolId = items
              .filter((c) => !!c)
              .map(PItems.getById)
              .find((item) => item.pIdolId)?.pIdolId;

            const cards = extractCards(
              img,
              blackCanvas,
              await signatureSkillCardsImageDataPromise,
              await nonSignatureSkillCardsImageDataPromise,
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

            const powerCandidates = extractPower(await engWhitePromise);
            const params = extractParams(await engBlackPromise);

            // Calculate contest power and flag those that are mismatched with the screenshot
            const calculatedPower = calculateContestPower(params, items, cards);
            const flag =
              !powerCandidates.includes(calculatedPower) ||
              itemsPIdolId != cardsPIdolId;

            const memory = {
              name: `${Math.max(...powerCandidates, 0)}${
                flag ? " (FIXME)" : ""
              }`,
              pIdolId: cardsPIdolId,
              params,
              pItemIds: items,
              skillCardIds: cards,
            };

            setProgress((p) => p + 1);
            resolve(memory);
          };
        })
    );

    Promise.all(promises).then(async (res) => {
      worker.terminate();

      const result = await fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memories: res }),
      });

      fetchMemories();
    });
  }

  return (
    <div className={styles.memoryImporter}>
      <div className={styles.top}>
        <input type="file" id="input" multiple onChange={handleFiles} />
        <IconButton
          icon={FaCircleQuestion}
          onClick={() => setShowModal(true)}
        />
      </div>
      <div className={styles.progress}>
        {progress != null && (
          <>
            Progress: {progress}/{total} {progress == total && <FaCheck />}
          </>
        )}
      </div>
      {showModal && (
        <Modal onClose={() => setShowModal(false)}>
          <h3>Import memories from screenshots</h3>
          <div className={styles.help}>
            <NextImage
              src="/memory_importer_reference.png"
              width={152}
              height={360}
            />
            <div>
              <p>
                Contest power, parameters, P-items, and skill card icons must be
                visible in each screenshot. The top of the white section must
                also be visible, and the bottom section must not be scrolled
                down.
              </p>
              <p>
                Importing may take several minutes or longer depending on the
                number of memories imported and your device&apos;s processor and
                memory. Use on a smartphone is not recommended.
              </p>
              <p>
                Some memories may fail to parse correctly, and require fixing
                after import. In such cases, they will be marked with
                &quot;(FIXME)&quot; in the name.
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
