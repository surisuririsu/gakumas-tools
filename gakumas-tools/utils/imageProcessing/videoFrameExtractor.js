import { DEBUG } from "./common";

const LOAD_TIMEOUT_MS = 300_000;
const SEEK_TIMEOUT_MS = 10_000;
// A 64×64 average is plenty for a brightness check and ~500× cheaper than
// drawing and reading a full-size frame.
const BRIGHTNESS_SAMPLE_SIZE = 64;

// Stream candidate frames — the dark frame immediately before each
// dark→bright brightness transition. Emits each frame as it's found in a
// single pass through the video, plus one extra re-seek per detected
// transition to capture the previous frame at full resolution.
//
// The same canvas is reused across yields, so consumers must finish with a
// frame (synchronously read its pixels, or pass it to an async API that
// captures the data synchronously) before resuming iteration.
//
// `onProgress(analyzed, total)` fires after each analyzed sample.
export async function* streamCandidateFrames(
  videoFile,
  {
    intervalMs = 500,
    brightnessThreshold = 180,
    onProgress,
  } = {},
) {
  const { video, blobURL } = await loadVideo(videoFile);
  try {
    const frameCount = Math.floor((video.duration * 1000) / intervalMs);
    const timeOf = (frame) => (frame * intervalMs) / 1000;

    const sampleCanvas = createCanvas(
      BRIGHTNESS_SAMPLE_SIZE,
      BRIGHTNESS_SAMPLE_SIZE,
    );
    const sampleCtx = sampleCanvas.getContext("2d", {
      willReadFrequently: true,
    });
    const frameCanvas = createCanvas(video.videoWidth, video.videoHeight);
    const frameCtx = frameCanvas.getContext("2d");

    // Start above the threshold so the first sample isn't treated as a
    // transition even if the video opens on a bright frame.
    let prevBrightness = 255;
    let found = 0;

    for (let i = 0; i < frameCount; i++) {
      await seekTo(video, timeOf(i));
      sampleCtx.drawImage(
        video,
        0,
        0,
        BRIGHTNESS_SAMPLE_SIZE,
        BRIGHTNESS_SAMPLE_SIZE,
      );
      const brightness = getAverageBrightness(sampleCanvas);
      onProgress?.(i + 1, frameCount);

      if (
        prevBrightness < brightnessThreshold &&
        brightness >= brightnessThreshold
      ) {
        // The rehearsal result screen is the DARK frame before the flash,
        // not the bright one. Re-seek back one interval to capture it.
        await seekTo(video, timeOf(i - 1));
        frameCtx.drawImage(video, 0, 0, frameCanvas.width, frameCanvas.height);
        found++;
        yield frameCanvas;
      }
      prevBrightness = brightness;
    }

    if (DEBUG) {
      console.log(
        `videoFrameExtractor: ${found} transitions in ${frameCount} frames`,
      );
    }
  } finally {
    URL.revokeObjectURL(blobURL);
  }
}

function loadVideo(videoFile) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const blobURL = URL.createObjectURL(videoFile);
    video.preload = "metadata";
    video.muted = true;
    video.playsInline = true;
    video.src = blobURL;

    const timeout = setTimeout(() => {
      URL.revokeObjectURL(blobURL);
      reject(new Error("Video loading timed out."));
    }, LOAD_TIMEOUT_MS);

    video.addEventListener(
      "loadedmetadata",
      () => {
        clearTimeout(timeout);
        if (!video.duration || !isFinite(video.duration)) {
          URL.revokeObjectURL(blobURL);
          reject(new Error("Invalid video duration."));
          return;
        }
        if (!video.videoWidth || !video.videoHeight) {
          URL.revokeObjectURL(blobURL);
          reject(new Error("Unable to read video dimensions."));
          return;
        }
        resolve({ video, blobURL });
      },
      { once: true },
    );

    video.addEventListener(
      "error",
      () => {
        clearTimeout(timeout);
        URL.revokeObjectURL(blobURL);
        const err = video.error;
        reject(
          err
            ? new Error(`Video error (code ${err.code}): ${err.message}`)
            : new Error("Failed to load video"),
        );
      },
      { once: true },
    );

    video.load();
  });
}

function seekTo(video, time) {
  return new Promise((resolve, reject) => {
    const onSeeked = () => {
      clearTimeout(timeout);
      resolve();
    };
    const timeout = setTimeout(() => {
      video.removeEventListener("seeked", onSeeked);
      reject(new Error(`Seek timed out at ${time.toFixed(2)}s`));
    }, SEEK_TIMEOUT_MS);
    video.addEventListener("seeked", onSeeked, { once: true });
    video.currentTime = time;
  });
}

function createCanvas(width, height) {
  if (typeof OffscreenCanvas !== "undefined") {
    return new OffscreenCanvas(width, height);
  }
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  return canvas;
}

function getAverageBrightness(canvas) {
  const ctx = canvas.getContext("2d");
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }
  return sum / (data.length / 4);
}
