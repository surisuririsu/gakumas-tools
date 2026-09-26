import { randomUUID } from "node:crypto";
import {
  DEFAULT_BANNER,
  bannerStatus,
  validateOshiSettings,
} from "@/utils/oshi";
import { readOshiSettings, saveOshiSettings } from "@/utils/oshiStore";

const USAGE = `Usage:
  pnpm oshi get
  pnpm oshi add '<json>' [--dry-run]
  pnpm oshi update <id> '<json>' [--dry-run]
  pnpm oshi remove <id> [--dry-run]

'<json>' can be - to read stdin. add and update merge it into a banner
(text per locale too). Times are ISO strings or null. Of the banners
currently in their window, the one that started most recently shows.`;

async function readPatch(arg) {
  if (arg != "-") return JSON.parse(arg);
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  return JSON.parse(input);
}

function merge(banner, patch) {
  return {
    ...banner,
    ...patch,
    id: banner.id,
    text: { ...banner.text, ...patch.text },
  };
}

function print(banners) {
  console.log(JSON.stringify({ banners }, null, 2));
  const now = new Date();
  for (const banner of banners) {
    const status = bannerStatus(banner, banners, now);
    console.error(`${banner.id}  ${status}  ${banner.text.ja}`);
  }
}

function findIndex(banners, id) {
  const index = banners.findIndex((banner) => banner.id == id);
  if (index < 0) throw new Error(`No banner with ID ${id}`);
  return index;
}

async function save(banners, dryRun) {
  const { settings, error } = validateOshiSettings({ banners });
  if (error) throw new Error(error);
  if (!dryRun) await saveOshiSettings(settings);
  print(settings.banners);
  console.error(dryRun ? "Dry run, not saved." : "Saved.");
}

const COMMANDS = {
  async get({ banners }) {
    print(banners);
  },
  async add({ banners }, [json], dryRun) {
    const banner = merge(
      { ...DEFAULT_BANNER, id: randomUUID() },
      await readPatch(json)
    );
    await save([...banners, banner], dryRun);
  },
  async update({ banners }, [id, json], dryRun) {
    const index = findIndex(banners, id);
    const patch = await readPatch(json);
    await save(banners.with(index, merge(banners[index], patch)), dryRun);
  },
  async remove({ banners }, [id], dryRun) {
    const index = findIndex(banners, id);
    await save(banners.toSpliced(index, 1), dryRun);
  },
};

const ARITY = { get: 0, add: 1, update: 2, remove: 1 };

const [command, ...rest] = process.argv.slice(2);
const dryRun = rest.includes("--dry-run");
const args = rest.filter((arg) => arg != "--dry-run");

try {
  if (!Object.hasOwn(COMMANDS, command) || args.length != ARITY[command]) {
    console.error(USAGE);
    process.exitCode = 1;
  } else {
    await COMMANDS[command](await readOshiSettings(), args, dryRun);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

process.exit();
