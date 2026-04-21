"use client";
import { useCallback, useState } from "react";
import { useTranslations } from "next-intl";
import Modal from "@/components/Modal";
import { getSimulatorLoadoutFromFile } from "@/utils/imageProcessing/simulatorLoadout";
import styles from "./SimulatorLoadoutImporterModal.module.scss";

function SimulatorLoadoutImporterModal({ onSuccess }) {
  const t = useTranslations("SimulatorLoadoutImporterModal");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleFile = useCallback(
    async (e) => {
      const file = e.target.files[0];
      if (!file) return;
      setLoading(true);
      setError(null);
      try {
        const result = await getSimulatorLoadoutFromFile(file);
        onSuccess(result);
      } catch (err) {
        console.error(err);
        setError(err.message || String(err));
      } finally {
        setLoading(false);
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

export default SimulatorLoadoutImporterModal;
