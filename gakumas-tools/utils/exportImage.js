import { downloadBlob } from "@/utils/download";

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
    }),
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

export async function exportImage({ ignore } = {}) {
  const node = document.getElementById("simulator_loadout");
  if (!node) throw new Error("Nothing to export");
  const { isIOS, isIOSSafari } = getExportTarget();
  const [, { default: html2canvas }] = await Promise.all([
    isIOS ? eagerLoadLazyImages() : Promise.resolve(),
    import("html2canvas"),
  ]);
  const canvas = await html2canvas(node, {
    backgroundColor: "#f2f2f5",
    scale: 2,
    useCORS: true,
    imageTimeout: 10000,
    logging: false,
    ignoreElements: (el) => el.dataset?.exportHide == "true" || !!ignore?.(el),
    onclone: (doc) => {
      doc.documentElement.dataset.exporting = "true";
    },
  });
  const blob = await new Promise((resolve) =>
    canvas.toBlob(resolve, "image/png"),
  );
  if (!blob) throw new Error("Couldn't encode image");

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
}
