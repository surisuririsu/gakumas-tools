export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  // Defer revoke so the browser has time to start the download; some browsers
  // (historically Firefox/Safari) abort the download if the URL is revoked
  // before the download request starts.
  setTimeout(() => URL.revokeObjectURL(url), 0);
}
