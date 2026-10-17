const SLOTS = [0, 1, 2];
const SLOT_PITCH = 0.1335;
const ICON_SIZE = 0.124;
const ICON_TOP = 0.04;
const OUTPUT_SIZE = 64;

// Ratios are of the screen width, measured on the result screen, where the
// middle slot sits at the horizontal center.
export function cropIcons(source, rows, ocrScale) {
  const width = source.width;
  const size = ICON_SIZE * width;
  return rows.map((row) => {
    if (!row) return null;
    const top = row.bbox.y1 / ocrScale + ICON_TOP * width;
    return SLOTS.map((slot) => {
      const left = width / 2 + (slot - 1) * SLOT_PITCH * width - size / 2;
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = OUTPUT_SIZE;
      canvas
        .getContext("2d")
        .drawImage(
          source,
          left,
          top,
          size,
          size,
          0,
          0,
          OUTPUT_SIZE,
          OUTPUT_SIZE,
        );
      const url = canvas.toDataURL("image/jpeg", 0.8);
      canvas.width = canvas.height = 0;
      return url;
    });
  });
}
