
import { MongoClient } from "mongodb";
import { PIdols, Idols } from "gakumas-data";

const { MONGODB_URI, MONGODB_DB } = process.env;

if (!MONGODB_URI) {
    console.error("Error: MONGODB_URI is not set");
    process.exit(1);
}

const client = new MongoClient(MONGODB_URI);

process.stdout.on('error', function (err) {
    if (err.code === "EPIPE") {
        process.exit(0);
    }
});

const NAME_TO_ID = {
    "saki": 1, "temari": 2, "kotone": 3, "tsubame": 13,
    "mao": 4, "lilja": 5, "china": 6,
    "sumika": 7, "hiro": 8, "sena": 11,
    "misuzu": 12, "ume": 10, "rinami": 9, "rina": 9
};

function parseOptions(argv) {
    const positionalArgs = [];
    const options = {};
    const args = argv.slice(2);
    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--sort' && args[i + 1]) {
            options.sort = args[++i];
        } else if (args[i] === '--cols' && args[i + 1]) {
            options.cols = parseInt(args[++i], 10);
        } else if (args[i] === '--asc') {
            options.asc = true;
        } else if (!args[i].startsWith('--')) {
            positionalArgs.push(args[i]);
        }
    }
    return { positionalArgs, options };
}

function extractScore(name) {
    // Name format: "26/04/12＿15159" - score is after ＿
    const match = name.match(/＿(\d+)/);
    if (match) return parseInt(match[1], 10);
    // Also try emoji/prefix patterns like "25/05/17🛠️13671"
    const match2 = name.match(/(\d+)\s*$/);
    if (match2) return parseInt(match2[1], 10);
    return 0;
}

async function run() {
    const { positionalArgs, options } = parseOptions(process.argv);
    let targetIdolKey = "all";

    if (positionalArgs.length > 0) {
        targetIdolKey = positionalArgs[0].toLowerCase();
    }

    const numCols = options.cols || 1;
    const sortField = options.sort || 'name';

    try {
        await client.connect();
        const db = client.db(MONGODB_DB);
        const collection = db.collection("memories");

        let query = {};
        let idolDisplayName = null;

        if (targetIdolKey !== "all") {
            const idolId = NAME_TO_ID[targetIdolKey];
            if (idolId) {
                const pIdols = PIdols.getAll().filter(p => p.idolId === idolId);
                const pIdolIds = pIdols.map(p => p.id);
                query = { pIdolId: { $in: pIdolIds } };
                const idol = Idols.getById(idolId);
                if (idol) idolDisplayName = idol.name.replace(" ", "");
            } else {
                console.error(`Unknown idol: ${targetIdolKey}`);
                process.exit(1);
            }
        }

        const cursor = collection.find(query);
        const memories = await cursor.toArray();

        let lines = [];
        for (const mem of memories) {
            if (mem.name) {
                const pIdol = PIdols.getById(mem.pIdolId);
                const idol = pIdol ? Idols.getById(pIdol.idolId) : null;
                const info = idol ? `${idol.name}【${pIdol.title}】` : "";
                lines.push({
                    name: mem.name,
                    score: extractScore(mem.name),
                    info: info,
                });
            }
        }

        // Sort
        if (sortField === 'score') {
            lines.sort((a, b) => options.asc ? a.score - b.score : b.score - a.score);
        } else {
            // By name includes date prefix so it sorts chronologically
            lines.sort((a, b) => options.asc ? a.name.localeCompare(b.name) : b.name.localeCompare(a.name));
        }

        const isSingleIdol = targetIdolKey !== "all" && idolDisplayName;

        if (isSingleIdol && numCols > 1) {
            // Markdown table format
            console.log(`# ${idolDisplayName}`);
            console.log('');

            const headers = Array.from({ length: numCols }, (_, i) => String(i + 1));
            console.log('| ' + headers.join(' | ') + ' |');
            console.log('| ' + headers.map(() => ':--').join(' | ') + ' |');

            const numRows = Math.ceil(lines.length / numCols);
            for (let row = 0; row < numRows; row++) {
                const cells = [];
                for (let col = 0; col < numCols; col++) {
                    const idx = row * numCols + col;
                    cells.push(idx < lines.length ? lines[idx].name : '');
                }
                console.log('| ' + cells.join(' | ') + ' |');
            }
        } else {
            // Standard output
            for (const line of lines) {
                if (isSingleIdol) {
                    console.log(line.name);
                } else {
                    console.log(`${line.name}\t${line.info}`);
                }
            }
        }

    } catch (e) {
        console.error("Error:", e);
        process.exit(1);
    } finally {
        await client.close();
    }
}

run();
