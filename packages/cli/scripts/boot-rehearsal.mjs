import { MongoClient } from "mongodb";
import { Stages, PIdols, SkillCards, Idols } from "gakumas-data";
import { Worker } from "worker_threads";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const MONGODB_URI = process.argv[2];
const stageIdArg = process.argv[3];
const runsArg = parseInt(process.argv[4], 10) || 100;
const deckNames = process.argv.slice(5).filter(n => n && !n.startsWith('--'));

if (!MONGODB_URI) {
    console.error("MongoDB URI is missing.");
    process.exit(1);
}

if (!stageIdArg || isNaN(parseInt(stageIdArg.split("-")[0], 10))) {
    console.error("Invalid stage argument.");
    process.exit(1);
}

const [seasonStr, stageStr] = stageIdArg.split("-");
const season = parseInt(seasonStr, 10);
const stageNumber = isNaN(parseInt(stageStr, 10)) ? stageStr : parseInt(stageStr, 10);

const stages = Stages.getAll();
const contestStage = stages.find((s) => (s.type === "contest" || s.type === "event" || s.type === "linkContest") && s.season === season && s.stage === stageNumber);

if (!contestStage) {
    console.error(`Stage not found: Season ${season} Stage ${stageNumber}`);
    process.exit(1);
}

const client = new MongoClient(MONGODB_URI);
let loadouts = [];

async function run() {
    try {
        await client.connect();
        const db = client.db(process.env.MONGODB_DB || "gakumas-tools");

        for (const name of deckNames) {
            const loadout = await db.collection("loadouts").findOne({ name });
            if (!loadout) {
                console.error(`Deck "${name}" not found.`);
                process.exit(1);
            }

            // Resolve Idol Name
            let idolName = "不明";
            if (loadout.skillCardIdGroups) {
                for (const group of loadout.skillCardIdGroups) {
                    if (group && group[0] > 0) {
                        const card = SkillCards.getById(group[0]);
                        if (card && card.pIdolId) {
                            const pIdol = PIdols.getById(card.pIdolId);
                            if (pIdol) {
                                const idol = Idols.getById(pIdol.idolId);
                                if (idol) {
                                    idolName = idol.name;
                                    break;
                                }
                            }
                        }
                    }
                }
            }

            loadouts.push({
                ...loadout,
                id: name,
                idolName: idolName
            });
        }
    } finally {
        await client.close();
    }

    if (loadouts.length === 0) {
        console.error("No valid decks provided.");
        process.exit(1);
    }

    // Run simulation
    const worker = new Worker(path.join(__dirname, 'simulate-loadout-worker.mjs'), {
        workerData: {
            contestStage,
            numRuns: runsArg
        }
    });

    worker.on('message', (msg) => {
        if (msg.type === 'done') {
            const results = msg.results;

            // Assign idol name back to result based on loadout.id
            const finalIdols = results.map((r, index) => {
                const correspondingLoadout = loadouts.find(l => l.id === r.id) || loadouts[index];
                return {
                    id: r.id,
                    idolName: correspondingLoadout.idolName || r.id,
                    min: r.min,
                    score: Math.floor(r.score),
                    max: r.max,
                };
            });

            // Helper to calculate score with 1.2x bonus for the highest
            const calcTotal = (key) => {
                const sorted = [...finalIdols].sort((a, b) => b[key] - a[key]);
                let total = 0;
                if (sorted.length > 0) {
                    total += sorted[0][key] * 1.2;
                    for (let i = 1; i < sorted.length; i++) {
                        total += sorted[i][key];
                    }
                }
                return Math.floor(total);
            };

            const finalData = {
                season: seasonStr,
                stage: stageStr,
                runs: runsArg,
                idols: finalIdols,
                totalScore: calcTotal('score'),
                totalMin: calcTotal('min'),
                totalMax: calcTotal('max')
            };

            console.log(JSON.stringify(finalData));
            process.exit(0);
        }
    });

    worker.on('error', (err) => {
        console.error(err);
        process.exit(1);
    });

    worker.on('exit', (code) => {
        if (code !== 0) {
            console.error(new Error(`Worker stopped with exit code ${code}`));
            process.exit(1);
        }
    });

    worker.postMessage({ id: 'rehearsal', loadouts });
}

run();
