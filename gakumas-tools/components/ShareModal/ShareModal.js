"use client";
import { useContext, useState } from "react";
import { useTranslations } from "next-intl";
import { FaDownload, FaShareNodes, FaXTwitter } from "react-icons/fa6";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import ModalContext from "@/contexts/ModalContext";
import styles from "./ShareModal.module.scss";

async function exportImage() {
  const node = document.getElementById("simulator_loadout");
  if (!node) return;
  node.classList.add("exporting");
  try {
    const { default: html2canvas } = await import("html2canvas");
    const canvas = await html2canvas(node, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      logging: false,
    });
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!blob) return;

    const file = new File([blob], "gakumas-loadout.png", { type: "image/png" });

    // iOS (Safari/Chrome/WKWebView) ignores programmatic <a download> clicks,
    // so route through Web Share there. Desktop/Android handle downloads fine.
    const isIOS =
      /iPad|iPhone|iPod/.test(navigator.userAgent) ||
      (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
    if (
      isIOS &&
      typeof navigator.canShare === "function" &&
      navigator.canShare({ files: [file] })
    ) {
      try {
        await navigator.share({ files: [file], title: "Gakumas loadout" });
        return;
      } catch (err) {
        if (err?.name === "AbortError") return;
        // Fall through to anchor download on any other share failure.
      }
    }

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.download = "gakumas-loadout.png";
    link.href = url;
    link.click();
    URL.revokeObjectURL(url);
  } finally {
    node.classList.remove("exporting");
  }
}

export default function ShareModal({ url }) {
  const t = useTranslations("ShareModal");
  const { closeModal } = useContext(ModalContext);
  const [exporting, setExporting] = useState(false);

  const canWebShare =
    typeof navigator !== "undefined" && typeof navigator.share === "function";

  async function webShare() {
    try {
      await navigator.share({ url, title: "Gakumas Tools" });
      closeModal();
    } catch {
      // User cancelled or share failed; stay open.
    }
  }

  async function saveImage() {
    setExporting(true);
    try {
      await exportImage();
      closeModal();
    } finally {
      setExporting(false);
    }
  }

  return (
    <Modal>
      <h3>{t("title")}</h3>
      <div className={styles.actions}>
        <Button style="primary" fill onClick={saveImage} disabled={exporting}>
          <FaDownload />
          {exporting ? t("exporting") : t("saveImage")}
        </Button>
        <Button
          style="default"
          fill
          onClick={() =>
            window.open(
              `https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}`,
              "_blank"
            )
          }
        >
          <FaXTwitter />
          {t("x")}
        </Button>
        {canWebShare && (
          <Button style="default" fill onClick={webShare}>
            <FaShareNodes />
            {t("more")}
          </Button>
        )}
      </div>
    </Modal>
  );
}
