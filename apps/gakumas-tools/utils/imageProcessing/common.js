export const DEBUG = false;

export function loadImageFromFile(file) {
  return new Promise((resolve) => {
    const blobURL = URL.createObjectURL(file);
    const img = new Image();
    img.src = blobURL;
    img.onload = () => resolve(img);
  });
}

export function getGameRegion(img) {
  let width = img.width;
  const height = img.height;
  if (img.width > (img.height * 9) / 16) {
    width = Math.round((img.height * 9) / 16);
  }
  return [Math.round((img.width - width) / 2), 0, width, height];
}

// Get a canvas with image black/white filtered
function getPreprocessedCanvas(img, textColorFn) {
  const [x, y, width, height] = getGameRegion(img);
  let canvas;
  if (DEBUG) {
    canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
  } else {
    canvas = new OffscreenCanvas(width, height);
  }
  const ctx = canvas.getContext("2d");
  ctx.drawImage(img, x, y, width, height, 0, 0, width, height);
  let d = ctx.getImageData(0, 0, width, height);
  for (var i = 0; i < d.data.length; i += 4) {
    if (textColorFn(d.data[i], d.data[i + 1], d.data[i + 2])) {
      d.data[i] = d.data[i + 1] = d.data[i + 2] = 0;
    } else {
      d.data[i] = d.data[i + 1] = d.data[i + 2] = 255;
    }
  }
  ctx.putImageData(d, 0, 0);

  return canvas;
}

// Black or entity edge color
export function getBlackCanvas(img) {
  return getPreprocessedCanvas(img, (r, g, b) => {
    const average = (r + g + b) / 3;
    return (
      [r, g, b].every((v) => Math.abs(v - average) < 8 && v < 185) ||
      (r > 70 && r < 120 && g > 70 && g < 120 && b > 90 && b < 130)
    );
  });
}

// White (contest power text)
export function getWhiteCanvas(img, threshold = 252) {
  return getPreprocessedCanvas(img, (r, g, b) =>
    [r, g, b].every((v) => v > threshold)
  );
}

// Get lines from result
export function extractLines(result) {
  return result.data.blocks
    .map((block) => block.paragraphs.map((paragraph) => paragraph.lines))
    .flat(2);
}
