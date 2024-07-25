import { useContext, useState } from "react";
import { SkillCards } from "gakumas-data";
import { FaCircleQuestion } from "react-icons/fa6";
import { createWorker } from "tesseract.js";
import IconButton from "@/components/IconButton";
import DataContext from "@/contexts/DataContext";
import { calculateContestPower } from "@/utils/contestPower";
import {
  extractPower,
  extractParams,
  extractCards,
  getBlackCanvas,
  getWhiteCanvas,
} from "@/utils/memoryFromImage";
import styles from "./MemoryImporter.module.scss";

export default function MemoryImporter() {
  const [total, setTotal] = useState("?");
  const [progress, setProgress] = useState(null);
  const { fetchMemories } = useContext(DataContext);

  async function handleFiles(e) {
    const engWorker = await createWorker("eng", 1);
    const jpnWorker = await createWorker("jpn", 1);
    const files = Array.from(e.target.files);

    setTotal(files.length);
    setProgress(0);

    const promises = files.map(
      (file) =>
        new Promise((resolve, reject) => {
          const blobURL = URL.createObjectURL(file);
          const img = new Image();
          img.src = blobURL;
          img.onload = async () => {
            const blackCanvas = getBlackCanvas(img);
            const whiteCanvas = getWhiteCanvas(img);

            const engWhitePromise = engWorker.recognize(whiteCanvas);
            const engBlackPromise = engWorker.recognize(blackCanvas);
            const jpnBlackPromise = jpnWorker.recognize(blackCanvas);

            const powerCandidates = extractPower(await engWhitePromise);
            const params = extractParams(await engBlackPromise);

            const items = [];
            while (items.length < 3) {
              items.push(0);
            }

            const cards = extractCards(await jpnBlackPromise);
            while (cards.length < 6) {
              cards.push(0);
            }

            const calculatedPower = calculateContestPower(params, [], cards);
            const flag = !powerCandidates.includes(calculatedPower);

            const memory = {
              name: `${Math.max(...powerCandidates)}${flag ? " (FIXME)" : ""}`,
              pIdolId: cards
                .filter((c) => !!c)
                .map(SkillCards.getById)
                .find((card) => card.pIdolId)?.pIdolId,
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
      const fetchPromise = fetch("/api/memory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memories: res }),
      });

      await engWorker.terminate();
      await jpnWorker.terminate();

      const result = await fetchPromise;
      fetchMemories();
    });
  }

  return (
    <div className={styles.memoryImporter}>
      <div className={styles.top}>
        <input type="file" id="input" multiple onChange={handleFiles} />
        <IconButton
          icon={FaCircleQuestion}
          onClick={() =>
            alert(
              "Import memories from screenshots.\n" +
                "Contest power, parameters, P-items, and names of skill cards must be visible in each screenshot.\n\n" +
                "Some memories may fail to parse, and require fixing after import.\n" +
                "Those will be labeled with (FIXME) in the name."
            )
          }
        />
      </div>
      <div className={styles.progress}>
        {progress != null && (
          <>
            Progress: {progress}/{total}
          </>
        )}
      </div>
    </div>
  );
}
