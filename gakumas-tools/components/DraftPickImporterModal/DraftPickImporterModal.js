"use client";
import { memo, useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import * as ort from "onnxruntime-web";
import Modal from "@/components/Modal";
import { getDraftPickFromFile } from "@/utils/imageProcessing/draftPick";
import styles from "./DraftPickImporterModal.module.scss";

function DraftPickImporterModal({ onSuccess }) {
  const t = useTranslations("DraftPickImporterModal");
  const [status, setStatus] = useState("idle");
  const [error, setError] = useState(null);

  const handleFile = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setStatus("processing");
      setError(null);
      try {
        const session = await ort.InferenceSession.create(
          "/skill_card_model.onnx",
        );
        const classes = await fetch("/skill_card_classes.json").then((r) =>
          r.json(),
        );
        const ids = await getDraftPickFromFile(file, session, classes);
        onSuccess(ids);
      } catch (err) {
        console.error(err);
        setError(err.message || String(err));
        setStatus("error");
      }
    },
    [onSuccess],
  );

  return (
    <Modal>
      <h3>{t("title")}</h3>
      <p className={styles.instructions}>{t("instructions")}</p>

      <input
        className={styles.file}
        type="file"
        accept="image/*"
        onChange={handleFile}
        disabled={status === "processing"}
      />

      {status === "processing" && (
        <div className={styles.status}>{t("processing")}</div>
      )}
      {status === "error" && (
        <div className={styles.error}>
          {t("error")}: {error}
        </div>
      )}
    </Modal>
  );
}

export default memo(DraftPickImporterModal);
