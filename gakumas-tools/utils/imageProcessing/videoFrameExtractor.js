import { DEBUG } from "./common";

const LOAD_TIMEOUT_MS = 300_000;
const SEEK_TIMEOUT_MS = 10_000;

export async function extractCandidateFrames(
  videoFile,
  intervalMs = 500,
  brightnessThreshold = 180,
) {
  const { video, blobURL } = await loadVideo(videoFile);
  try {
    const frameCount = Math.floor((video.duration * 1000) / intervalMs);
    const timeOf = (frame) => (frame * intervalMs) / 1000;

    // First pass: measure brightness at each interval using one reusable canvas.
    const tempCanvas = createCanvas(video.videoWidth, video.videoHeight);
    const tempCtx = tempCanvas.getContext("2d");
    const brightnesses = [];
    for (let i = 0; i < frameCount; i++) {
      await seekTo(video, timeOf(i));
      tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
      brightnesses.push(getAverageBrightness(tempCanvas));
    }

    const transitions = findDarkToBrightTransitions(
      brightnesses,
      brightnessThreshold,
    );
    if (DEBUG) {
      console.log(
        `videoFrameExtractor: ${transitions.length} transitions in ${frameCount} frames`,
      );
    }

    // Second pass: capture each transition frame to its own canvas.
    const frames = [];
    for (const frameIndex of transitions) {
      await seekTo(video, timeOf(frameIndex));
      const canvas = createCanvas(video.videoWidth, video.videoHeight);
      canvas.getContext("2d").drawImage(video, 0, 0, canvas.width, canvas.height);
      frames.push(canvas);
    }
    return frames;
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

function findDarkToBrightTransitions(brightnesses, threshold) {
  const transitions = [];
  for (let i = 0; i < brightnesses.length - 1; i++) {
    if (brightnesses[i] < threshold && brightnesses[i + 1] > threshold) {
      transitions.push(i);
    }
  }
  return transitions;
}

export function canvasToImage(canvas) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let objectURL = null;
    img.onload = () => {
      if (objectURL) URL.revokeObjectURL(objectURL);
      resolve(img);
    };
    img.onerror = (err) => {
      if (objectURL) URL.revokeObjectURL(objectURL);
      reject(err);
    };
    // OffscreenCanvas → convertToBlob; regular canvas → toDataURL.
    if (canvas.convertToBlob) {
      canvas.convertToBlob().then((blob) => {
        objectURL = URL.createObjectURL(blob);
        img.src = objectURL;
      }, reject);
    } else {
      img.src = canvas.toDataURL();
    }
  });
}

export function getAverageBrightness(canvas) {
  const ctx = canvas.getContext("2d");
  const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height);
  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }
  return sum / (data.length / 4);
}
