import { connect } from "@/utils/mongodb";

const USAGE = `Usage:
  pnpm comparisons count
  pnpm comparisons export [--since YYYY-MM-DD] > comparisons.jsonl

Rehearsal comparisons shared from the simulator's Rehearsal tab.
Feed the export to \`pnpm fidelity\` at the repo root.`;

function sinceFilter(args) {
  const index = args.indexOf("--since");
  if (index < 0) return {};
  const since = new Date(args[index + 1]);
  if (isNaN(since)) throw new Error("--since needs a date");
  return { updatedAt: { $gte: since } };
}

const COMMANDS = {
  async count(collection, args) {
    console.log(await collection.countDocuments(sinceFilter(args)));
  },
  async export(collection, args) {
    const cursor = collection.find(sinceFilter(args)).sort({ updatedAt: 1 });
    for await (const doc of cursor) console.log(JSON.stringify(doc));
  },
};

const [command, ...args] = process.argv.slice(2);

try {
  if (!Object.hasOwn(COMMANDS, command)) {
    console.error(USAGE);
    process.exitCode = 1;
  } else {
    const { db } = await connect();
    await COMMANDS[command](db.collection("rehearsalComparisons"), args);
  }
} catch (error) {
  console.error(error.message);
  process.exitCode = 1;
}

process.exit();
