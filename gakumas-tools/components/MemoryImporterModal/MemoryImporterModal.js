"use client";
import { memo, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { createWorker } from "tesseract.js";
import Image from "@/components/Image";
import Loader from "@/components/Loader";
import Modal from "@/components/Modal";
import ProgressBar from "@/components/ProgressBar";
import ModalContext from "@/contexts/ModalContext";
import ToastContext from "@/contexts/ToastContext";
import c from "@/utils/classNames";
import { getMemoryFromFile } from "@/utils/imageProcessing/memory";
import {
  loadPItemModel,
  loadSkillCardModel,
} from "@/utils/imageProcessing/models";
import { logEvent } from "@/utils/logging";
import styles from "./MemoryImporterModal.module.scss";

const BUSY_STATUSES = ["preparing", "reading", "saving"];

function MemoryImporterModal({ onSuccess, multiple = true }) {
  const t = useTranslations("MemoryImporterModal");
  const { closeModal } = useContext(ModalContext);
  const { showToast } = useContext(ToastContext);

  const [status, setStatus] = useState(null);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const engWorkerRef = useRef(null);
  const busy = BUSY_STATUSES.includes(status);

  useEffect(
    () => () => {
      engWorkerRef.current?.then((worker) => worker.terminate());
    },
    []
  );

  const handleFiles = useCallback(
    async (e) => {
      const files = Array.from(e.target.files);
      if (!files.length) return;
      setTotal(files.length);
      setProgress(0);
      setStatus("preparing");

      try {
        engWorkerRef.current ??= createWorker("eng", 1);
        const [engWorker, pItemModel, skillCardModel] = await Promise.all([
          engWorkerRef.current,
          loadPItemModel(),
          loadSkillCardModel(),
        ]);

        console.time("All memories parsed");
        setStatus("reading");
        const results = [];
        for (const file of files) {
          results.push(
            await getMemoryFromFile(
              file,
              engWorker,
              pItemModel.session,
              pItemModel.classes,
              skillCardModel.session,
              skillCardModel.classes
            )
          );
          setProgress((p) => p + 1);
        }
        console.timeEnd("All memories parsed");

        logEvent("memories.import", {
          num: results.length,
        });

        setStatus("saving");
        if ((await onSuccess(results)) === false) {
          throw new Error("Couldn't save imported memories");
        }
        closeModal();
        showToast({
          tone: "success",
          message: t("imported", { num: results.length }),
        });
      } catch (err) {
        console.error(err);
        setStatus("error");
      }
    },
    [onSuccess, closeModal, showToast, t]
  );

  return (
    <Modal dismissable={!busy}>
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
        multiple={multiple}
        accept="image/*"
        disabled={busy}
        onChange={handleFiles}
      />

      <div
        className={c(styles.progress, status == "error" && styles.error)}
        aria-live="polite"
      >
        {busy && <Loader />}
        {status == "preparing" && t("preparing")}
        {status == "reading" && t("progress", { progress, total })}
        {status == "saving" && t("saving")}
        {status == "error" && t("failed")}
      </div>
      {status == "reading" && <ProgressBar value={progress} max={total} />}
    </Modal>
  );
}

export default memo(MemoryImporterModal);
