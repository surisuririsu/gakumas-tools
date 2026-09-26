import { connect } from "@/utils/mongodb";
import { DEFAULT_OSHI_SETTINGS } from "@/utils/oshi";

const DOC_ID = "oshi";
const CACHE_TTL_MS = 60 * 1000;
const FIRST_LOAD_TIMEOUT_MS = 2000;

// Shared through global so the API route's writes reach the layout's reads.
const cache = (global.oshiSettings ??= { entry: null, refreshing: null });

async function settingsCollection() {
  const { db } = await connect();
  return db.collection("settings");
}

function setCached(settings) {
  cache.entry = { settings, expiresAt: Date.now() + CACHE_TTL_MS };
}

export async function readOshiSettings() {
  const collection = await settingsCollection();
  const doc = await collection.findOne(
    { _id: DOC_ID },
    { projection: { _id: 0, updatedAt: 0 } }
  );
  return { ...DEFAULT_OSHI_SETTINGS, ...doc };
}

export async function saveOshiSettings(settings) {
  const collection = await settingsCollection();
  await collection.replaceOne(
    { _id: DOC_ID },
    { ...settings, updatedAt: new Date() },
    { upsert: true }
  );
  setCached(settings);
}

function refresh() {
  cache.refreshing ??= readOshiSettings()
    .catch((error) => {
      console.error("Failed to load oshi settings", error);
      return cache.entry?.settings ?? DEFAULT_OSHI_SETTINGS;
    })
    .then(setCached)
    .finally(() => (cache.refreshing = null));
  return cache.refreshing;
}

export async function getCachedOshiSettings() {
  if (!cache.entry) {
    await Promise.race([
      refresh(),
      new Promise((resolve) => setTimeout(resolve, FIRST_LOAD_TIMEOUT_MS)),
    ]);
  } else if (Date.now() > cache.entry.expiresAt) {
    refresh();
  }
  return cache.entry?.settings ?? DEFAULT_OSHI_SETTINGS;
}
