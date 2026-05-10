import { memo, useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { FaCopy, FaDownload, FaXTwitter } from "react-icons/fa6";
import Modal from "@/components/Modal";
import styles from "./TierShareModal.module.scss";

const TYPE_FILE_PREFIX = {
  P_ITEM: "p-items",
  SKILL_CARD: "skill-cards",
  P_DRINK: "p-drinks",
  P_IDOL: "p-idols",
};

const TAB_KEY_BY_TYPE = {
  P_ITEM: "p-items",
  SKILL_CARD: "skill-cards",
  P_DRINK: "p-drinks",
  P_IDOL: "p-idols",
};

function TierShareModal({ type, getImageNode, onClose }) {
  const t = useTranslations("TierList");
  const tDex = useTranslations("Dex");
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState(null);
  const copyTimerRef = useRef(null);

  useEffect(() => {
    setShareUrl(window.location.href);
  }, []);

  useEffect(() => () => clearTimeout(copyTimerRef.current), []);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopied(false), 2000);
    } catch {
      setError(t("copyFailed"));
    }
  }, [shareUrl, t]);

  const downloadImage = useCallback(async () => {
    const node = getImageNode?.();
    if (!node) return;
    setDownloading(true);
    setError(null);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(node, {
        useCORS: true,
        backgroundColor: "#ffffff",
        scale: window.devicePixelRatio > 1 ? 2 : 1,
        ignoreElements: (el) =>
          el?.dataset?.exportIgnore === "true",
      });
      const blob = await new Promise((resolve) =>
        canvas.toBlob(resolve, "image/png"),
      );
      if (!blob) throw new Error("Failed to render image");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `tier-list-${TYPE_FILE_PREFIX[type] || "list"}.png`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      setTimeout(() => URL.revokeObjectURL(url), 0);
    } catch (e) {
      console.error(e);
      setError(t("exportFailed"));
    } finally {
      setDownloading(false);
    }
  }, [getImageNode, type, t]);

  const shareToX = useCallback(() => {
    const tabKey = TAB_KEY_BY_TYPE[type];
    const entityName = tabKey ? tDex(`tabs.${tabKey}`) : "";
    const text = t("shareTweetText", { type: entityName });
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(
      text,
    )}&url=${encodeURIComponent(shareUrl)}`;
    window.open(url, "_blank");
  }, [type, shareUrl, t, tDex]);

  return (
    <Modal onClose={onClose}>
      <h3>{t("share")}</h3>
      <p className={styles.help}>{t("shareHelp")}</p>
      <div className={styles.urlRow}>
        <input
          type="text"
          className={styles.urlInput}
          value={shareUrl}
          readOnly
          onFocus={(e) => e.target.select()}
        />
        <button type="button" className={styles.copyBtn} onClick={copy}>
          <FaCopy />
          {copied ? t("copied") : t("copy")}
        </button>
      </div>
      <div className={styles.actionRow}>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={downloadImage}
          disabled={downloading}
        >
          <FaDownload />
          {downloading ? t("preparingImage") : t("downloadImage")}
        </button>
        <button
          type="button"
          className={styles.actionBtn}
          onClick={shareToX}
        >
          <FaXTwitter />
          {t("shareToX")}
        </button>
      </div>
      {error && <p className={styles.error}>{error}</p>}
    </Modal>
  );
}

export default memo(TierShareModal);
