import { validateOshiSettings } from "@/utils/oshi";
import { readOshiSettings, saveOshiSettings } from "@/utils/oshiStore";

const USAGE = `Usage:
  pnpm oshi get
  pnpm oshi set '<json>' [--dry-run]
  pnpm oshi set - [--dry-run] < patch.json

"set" merges the JSON into the current banner (text per locale too), so
'{"enabled": false}' just hides it. Times are ISO strings or null.`;

async function readPatch(arg) {
  if (arg != "-") return JSON.parse(arg);
  let input = "";
  for await (const chunk of process.stdin) input += chunk;
  return JSON.parse(input);
}

function print(settings) {
  console.log(JSON.stringify(settings, null, 2));
}

async function set(arg, dryRun) {
  const patch = await readPatch(arg);
  const current = await readOshiSettings();
  const { settings, error } = validateOshiSettings({
    ...current,
    ...patch,
    text: { ...current.text, ...patch.text },
  });
  if (error) throw new Error(error);

  if (!dryRun) await saveOshiSettings(settings);
  print(settings);
  console.error(dryRun ? "Dry run, not saved." : "Saved.");
}

const [command, arg, ...flags] = process.argv.slice(2);

try {
  if (command == "get") {
    print(await readOshiSettings());
  } else if (command == "set" && arg) {
    await set(arg, flags.includes("--dry-run"));
  } else {
    console.error(USAGE);
    process.exitCode = 1;
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

process.exit();
