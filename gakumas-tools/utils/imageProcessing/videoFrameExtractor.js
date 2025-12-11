export async function extractCandidateFrames(
  videoFile,
  intervalMs = 500,
  brightnessThreshold = 180
) {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const blobURL = URL.createObjectURL(videoFile);

    video.preload = "metadata";
    video.src = blobURL;
    video.muted = true;
    video.playsInline = true;

    const candidateFrames = [];
    const brightnesses = [];
    let seekTimeout = null;

    const loadTimeout = setTimeout(() => {
      URL.revokeObjectURL(blobURL);
      reject(new Error("Video loading timed out."));
    }, 30000);

    const cleanup = () => {
      clearTimeout(loadTimeout);
      if (seekTimeout) clearTimeout(seekTimeout);
    };

    video.addEventListener("loadedmetadata", () => {
      if (
        !video.duration ||
        video.duration === Infinity ||
        isNaN(video.duration)
      ) {
        cleanup();
        URL.revokeObjectURL(blobURL);
        reject(new Error("Invalid video duration."));
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

      // Reusable canvas for brightness detection
      let tempCanvas;
      if (typeof OffscreenCanvas !== "undefined") {
        tempCanvas = new OffscreenCanvas(video.videoWidth, video.videoHeight);
      } else {
        tempCanvas = document.createElement("canvas");
        tempCanvas.width = video.videoWidth;
        tempCanvas.height = video.videoHeight;
      }
      const tempCtx = tempCanvas.getContext("2d");

      // First pass: collect all brightnesses
      const firstPassSeek = () => {
        if (currentFrame >= frameCount) {
          // First pass complete, now identify transitions
          console.log(`Analyzed ${brightnesses.length} frames for transitions`);
          const transitions = [];

          for (let i = 0; i < brightnesses.length - 1; i++) {
            if (
              brightnesses[i] < brightnessThreshold &&
              brightnesses[i + 1] > brightnessThreshold
            ) {
              console.log(
                `Transition detected at frame ${i}: ${brightnesses[i].toFixed(
                  1
                )} -> ${brightnesses[i + 1].toFixed(1)}`
              );
              transitions.push(i);
            }
          }

          // Now extract only those specific frames
          console.log(
            `Found ${transitions.length} transitions, extracting those frames...`
          );
          currentFrame = 0;

          const secondPassSeek = () => {
            if (currentFrame >= transitions.length) {
              cleanup();
              URL.revokeObjectURL(blobURL);
              console.log(
                `Extraction complete: ${candidateFrames.length} candidate frames`
              );
              resolve(candidateFrames);
              return;
            }

            const frameIndex = transitions[currentFrame];
            const targetTime = (frameIndex * intervalMs) / 1000;

            if (seekTimeout) clearTimeout(seekTimeout);
            seekTimeout = setTimeout(() => {
              cleanup();
              URL.revokeObjectURL(blobURL);
              reject(
                new Error(`Second pass seek timeout at frame ${frameIndex}`)
              );
            }, 10000);

            video.currentTime = targetTime;
            currentFrame++;
          };

          // Handle second pass seeks
          const secondPassHandler = () => {
            if (seekTimeout) clearTimeout(seekTimeout);

            try {
              let canvas;
              if (typeof OffscreenCanvas !== "undefined") {
                canvas = new OffscreenCanvas(
                  video.videoWidth,
                  video.videoHeight
                );
              } else {
                canvas = document.createElement("canvas");
                canvas.width = video.videoWidth;
                canvas.height = video.videoHeight;
              }

              const ctx = canvas.getContext("2d");
              ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
              candidateFrames.push(canvas);

              setTimeout(secondPassSeek, 0);
            } catch (error) {
              cleanup();
              URL.revokeObjectURL(blobURL);
              reject(new Error(`Failed to capture frame: ${error.message}`));
            }
          };

          video.removeEventListener("seeked", firstPassHandler);
          video.addEventListener("seeked", secondPassHandler);
          secondPassSeek();
          return;
        }

        const targetTime = (currentFrame * intervalMs) / 1000;

        if (seekTimeout) clearTimeout(seekTimeout);
        seekTimeout = setTimeout(() => {
          cleanup();
          URL.revokeObjectURL(blobURL);
          reject(new Error(`First pass seek timeout at frame ${currentFrame}`));
        }, 10000);

        video.currentTime = targetTime;
        currentFrame++;
      };

      const firstPassHandler = () => {
        if (seekTimeout) clearTimeout(seekTimeout);

        try {
          tempCtx.drawImage(video, 0, 0, tempCanvas.width, tempCanvas.height);
          const brightness = getAverageBrightness(tempCanvas);
          brightnesses.push(brightness);

          setTimeout(firstPassSeek, 0);
        } catch (error) {
          cleanup();
          URL.revokeObjectURL(blobURL);
          reject(new Error(`Failed to analyze frame: ${error.message}`));
        }
      };

      video.addEventListener("seeked", firstPassHandler);
      firstPassSeek();
    });

    video.addEventListener("error", (e) => {
      cleanup();
      URL.revokeObjectURL(blobURL);
      const errorMsg = video.error
        ? `Video error (code ${video.error.code}): ${video.error.message}`
        : `Failed to load video`;
      reject(new Error(errorMsg));
    });

    video.load();
  });
}

export function canvasToImage(canvas) {
  return new Promise(async (resolve, reject) => {
    try {
      const img = new Image();
      img.onload = () => resolve(img);

      // OffscreenCanvas uses convertToBlob(), regular canvas uses toDataURL()
      if (canvas.convertToBlob) {
        const blob = await canvas.convertToBlob();
        img.src = URL.createObjectURL(blob);
      } else {
        img.src = canvas.toDataURL();
      }
    } catch (error) {
      reject(error);
    }
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
