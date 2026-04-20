"use client";
import { useContext, useState } from "react";
import { useTranslations } from "next-intl";
import { FaDownload, FaShareNodes, FaXTwitter } from "react-icons/fa6";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import ModalContext from "@/contexts/ModalContext";
import { downloadBlob } from "@/utils/download";
import styles from "./ShareModal.module.scss";

const FILENAME = "gakumas-loadout.png";

// iOS Safari/Chrome hang html2canvas forever if ANY image on the page has
// loading="lazy" — the cloned iframe's readyState never reaches 'complete'.
async function eagerLoadLazyImages() {
  const lazy = Array.from(document.querySelectorAll('img[loading="lazy"]'));
  await Promise.all(
    lazy.map((img) => {
      img.loading = "eager";
      if (img.complete) return Promise.resolve();
      return new Promise((resolve) => {
        img.addEventListener("load", resolve, { once: true });
        img.addEventListener("error", resolve, { once: true });
      });
    })
  );
}

function getExportTarget() {
  const ua = navigator.userAgent;
  const isIOS =
    /iPad|iPhone|iPod/.test(ua) ||
    (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  // iOS Safari exposes "Save Image" (→ Photos) in the share sheet; iOS Chrome
  // doesn't, so use Web Share only on Safari. Other iOS browsers fall through
  // to anchor download, landing in Files.
  const isIOSSafari = isIOS && !/CriOS|FxiOS|EdgiOS/.test(ua);
  return { isIOS, isIOSSafari };
}

async function exportImage() {
  const node = document.getElementById("simulator_loadout");
  if (!node) return;
  node.classList.add("exporting");
  try {
    const { isIOS, isIOSSafari } = getExportTarget();
    const [, { default: html2canvas }] = await Promise.all([
      isIOS ? eagerLoadLazyImages() : Promise.resolve(),
      import("html2canvas"),
    ]);
    const canvas = await html2canvas(node, {
      backgroundColor: "#ffffff",
      scale: 2,
      useCORS: true,
      imageTimeout: 10000,
      logging: false,
    });
    const blob = await new Promise((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!blob) return;

    if (isIOSSafari) {
      const file = new File([blob], FILENAME, { type: "image/png" });
      if (
        typeof navigator.canShare === "function" &&
        navigator.canShare({ files: [file] })
      ) {
        try {
          await navigator.share({ files: [file] });
          return;
        } catch (err) {
          if (err?.name === "AbortError") return;
        }
      }
    }

    downloadBlob(blob, FILENAME);
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
    let timeoutId;
    try {
      const timeout = new Promise((_, reject) => {
        timeoutId = setTimeout(
          () => reject(new Error("Export timed out")),
          30000
        );
      });
      await Promise.race([exportImage(), timeout]);
      closeModal();
    } catch (err) {
      console.error(err);
    } finally {
      clearTimeout(timeoutId);
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
