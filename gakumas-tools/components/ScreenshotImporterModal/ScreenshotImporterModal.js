"use client";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/Modal";
import styles from "./ScreenshotImporterModal.module.scss";

function ScreenshotImporterModal({ translationNamespace, importFn, onSuccess }) {
  const t = useTranslations(translationNamespace);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setLoading(true);
      setError(null);
      try {
        const result = await importFn(file);
        onSuccess(result);
      } catch (err) {
        console.error(err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
      }
    },
    [importFn, onSuccess],
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
        disabled={loading}
      />

      {loading && <div className={styles.status}>{t("processing")}</div>}
      {error && (
        <div className={styles.error}>
          {t("error")}: {error}
        </div>
      )}
    </Modal>
  );
}

export default ScreenshotImporterModal;
