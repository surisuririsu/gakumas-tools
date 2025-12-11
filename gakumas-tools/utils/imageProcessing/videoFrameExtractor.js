export async function extractFramesFromVideo(videoFile, intervalMs = 500) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const blobURL = URL.createObjectURL(videoFile);

    video.preload = "auto";
    video.src = blobURL;
    video.muted = true;

    const frames = [];

    video.addEventListener("loadedmetadata", () => {
      const duration = video.duration;
      const frameCount = Math.floor((duration * 1000) / intervalMs);
      let currentFrame = 0;

      const captureFrame = () => {
        if (currentFrame >= frameCount) {
          URL.revokeObjectURL(blobURL);
          resolve(frames);
          return;
        }

        const targetTime = (currentFrame * intervalMs) / 1000;
        video.currentTime = targetTime;
        currentFrame++;
      };

      video.addEventListener("seeked", () => {
        const canvas = document.createElement("canvas");
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

        frames.push(canvas);

        captureFrame();
      });

      captureFrame();
    });

    video.addEventListener("error", (e) => {
      URL.revokeObjectURL(blobURL);
      reject(new Error(`Failed to load video: ${e.message}`));
    });
  });
}

export function canvasToImage(canvas) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.src = canvas.toDataURL();
  });
}

export function getAverageBrightness(canvas) {
  const ctx = canvas.getContext("2d");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const data = imageData.data;

  let sum = 0;
  for (let i = 0; i < data.length; i += 4) {
    sum += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
  }

  return sum / (data.length / 4);
}
