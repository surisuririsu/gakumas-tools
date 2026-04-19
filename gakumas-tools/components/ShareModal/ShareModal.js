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
  // Toggle `.exporting` on the root so the real DOM reflows before capture
  // — html-to-image's `filter` skips cloning but doesn't collapse layout,
  // which is why hidden regions came out as blank space.
  node.classList.add("exporting");
  try {
    const { toPng } = await import("html-to-image");
    const dataUrl = await toPng(node, {
      backgroundColor: "#ffffff",
      pixelRatio: 2,
      cacheBust: true,
    });
    const link = document.createElement("a");
    link.download = "gakumas-loadout.png";
    link.href = dataUrl;
    link.click();
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
