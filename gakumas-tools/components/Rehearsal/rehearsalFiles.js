const VIDEO_EXT = /\.(mp4|mov|avi|mkv|webm)$/i;
const CSV_EXT = /\.csv$/i;

export function bucketFiles(files) {
  const csvs = [];
  const videos = [];
  const images = [];
  for (const f of files) {
    if (f.type === "text/csv" || CSV_EXT.test(f.name)) csvs.push(f);
    else if (f.type.startsWith("video/") || VIDEO_EXT.test(f.name)) videos.push(f);
    else images.push(f);
  }
  return { csvs, videos, images };
}

export async function parseCsvFile(file) {
  const text = await file.text();
  return text
    .trim()
    .split("\n")
    .map((line) => {
      const row = line.split(",").map(Number);
      return [row.slice(0, 3), row.slice(3, 6), row.slice(6, 9)];
    });
}
