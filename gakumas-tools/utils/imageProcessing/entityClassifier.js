export const ICON_SIZE = 64;
const PIXELS = ICON_SIZE * ICON_SIZE;

export function packCrops(crops, channels) {
  const batch = new Float32Array(crops.length * 3 * PIXELS);
  crops.forEach((pixels, i) => {
    const offset = i * 3 * PIXELS;
    for (let j = 0; j < PIXELS; j++) {
      batch[offset + j] = pixels[j * channels] / 255;
      batch[offset + PIXELS + j] = pixels[j * channels + 1] / 255;
      batch[offset + 2 * PIXELS + j] = pixels[j * channels + 2] / 255;
    }
  });
  return batch;
}

// Classes are "<entity id>" or "<entity id>_<idol id>" for art variants.
export function decodeEntityIds(logits, classes) {
  const numClasses = classes.length;
  const ids = [];
  for (let offset = 0; offset < logits.length; offset += numClasses) {
    let best = 0;
    for (let k = 1; k < numClasses; k++) {
      if (logits[offset + k] > logits[offset + best]) best = k;
    }
    ids.push(parseInt(classes[best].split("_")[0], 10));
  }
  return ids;
}

export async function classifyCrops(ort, session, classes, crops, channels) {
  if (!crops.length) return [];
  const input = new ort.Tensor("float32", packCrops(crops, channels), [
    crops.length,
    3,
    ICON_SIZE,
    ICON_SIZE,
  ]);
  const output = await session.run({ input }, ["classifier"]);
  return decodeEntityIds(output.classifier.data, classes);
}
