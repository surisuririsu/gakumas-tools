export async function extractFramesFromVideo(videoFile, intervalMs = 500) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const blobURL = URL.createObjectURL(videoFile);

    video.preload = "metadata";
    video.src = blobURL;
    video.muted = true;
    video.playsInline = true; // Critical for iOS/mobile

    const frames = [];
    let seekTimeout = null;

    // Timeout to detect if video loading fails silently
    const loadTimeout = setTimeout(() => {
      URL.revokeObjectURL(blobURL);
      reject(
        new Error(
          "Video loading timed out. The video format may not be supported on this device."
        )
      );
    }, 30000); // 30 second timeout

    const cleanup = () => {
      clearTimeout(loadTimeout);
      if (seekTimeout) clearTimeout(seekTimeout);
    };

    video.addEventListener("loadedmetadata", () => {
      console.log(
        `Video loaded: ${video.duration}s, ${video.videoWidth}x${video.videoHeight}`
      );

      // Check if video metadata is valid
      if (
        !video.duration ||
        video.duration === Infinity ||
        isNaN(video.duration)
      ) {
        cleanup();
        URL.revokeObjectURL(blobURL);
        reject(
          new Error(
            "Invalid video duration. This video format may not be fully supported on mobile."
          )
        );
        return;
      }

      if (!video.videoWidth || !video.videoHeight) {
        cleanup();
        URL.revokeObjectURL(blobURL);
        reject(new Error("Unable to read video dimensions."));
        return;
      }

      const duration = video.duration;
      const frameCount = Math.floor((duration * 1000) / intervalMs);
      let currentFrame = 0;
      let lastSeekTime = Date.now();

      const captureFrame = () => {
        if (currentFrame >= frameCount) {
          cleanup();
          URL.revokeObjectURL(blobURL);
          console.log(`Extraction complete: ${frames.length} frames captured`);
          resolve(frames);
          return;
        }

        const targetTime = (currentFrame * intervalMs) / 1000;
        console.log(
          `Seeking to frame ${currentFrame} at ${targetTime.toFixed(2)}s`
        );

        // Reset seek timeout
        if (seekTimeout) clearTimeout(seekTimeout);
        seekTimeout = setTimeout(() => {
          cleanup();
          URL.revokeObjectURL(blobURL);
          reject(
            new Error(
              `Seek operation timed out at frame ${currentFrame}. Captured ${frames.length} frames before timeout.`
            )
          );
        }, 10000); // 10 second timeout per seek

        lastSeekTime = Date.now();
        video.currentTime = targetTime;
        currentFrame++;
      };

      video.addEventListener("seeked", () => {
        if (seekTimeout) clearTimeout(seekTimeout);

        console.log(
          `Seeked to ${video.currentTime.toFixed(2)}s (took ${
            Date.now() - lastSeekTime
          }ms)`
        );

        try {
          const canvas = document.createElement("canvas");
          canvas.width = video.videoWidth;
          canvas.height = video.videoHeight;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

          frames.push(canvas);
          console.log(`Captured frame ${frames.length}`);

          // Use setTimeout to allow UI updates on mobile
          setTimeout(captureFrame, 0);
        } catch (error) {
          cleanup();
          URL.revokeObjectURL(blobURL);
          reject(new Error(`Failed to capture frame: ${error.message}`));
        }
      });

      video.addEventListener("error", (e) => {
        cleanup();
        URL.revokeObjectURL(blobURL);
        reject(
          new Error(
            `Video error during playback: ${e.message || "Unknown error"}`
          )
        );
      });

      // Start capturing
      captureFrame();
    });

    video.addEventListener("error", (e) => {
      cleanup();
      URL.revokeObjectURL(blobURL);
      const errorMsg = video.error
        ? `Video error (code ${video.error.code}): ${video.error.message}`
        : `Failed to load video: ${e.message || "Unknown error"}`;
      reject(new Error(errorMsg));
    });

    // Try to load the video
    video.load();
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
