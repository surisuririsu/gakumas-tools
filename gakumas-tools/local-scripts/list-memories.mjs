
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

async function run() {
    const args = process.argv.slice(2);
    let targetIdolKey = "all";

    if (args.length > 0) {
        targetIdolKey = args[0].toLowerCase();
    }

    try {
        await client.connect();
        const db = client.db(MONGODB_DB);
        const collection = db.collection("memories");

        let query = {};

        if (targetIdolKey !== "all") {
            const idolId = NAME_TO_ID[targetIdolKey];
            if (idolId) {
                const pIdols = PIdols.getAll().filter(p => p.idolId === idolId);
                const pIdolIds = pIdols.map(p => p.id);
                query = { pIdolId: { $in: pIdolIds } };
            } else {
                // If invalid idol name, maybe treat as no filter or exit?
                // For now, if it's not a known idol name, we might want to error out or just list nothing.
                // But if the user meant to list everything, they wouldn't provide an invalid name.
                console.error(`Unknown idol: ${targetIdolKey}`);
                process.exit(1);
            }
        }

        const cursor = collection.find(query);

        // Stream names? Or just fetch all and print?
        // Fetching all is fine for now as memories count is likely in thousands not millions.
        const memories = await cursor.toArray();

        for (const mem of memories) {
            if (mem.name) {
                const pIdol = PIdols.getById(mem.pIdolId);
                const idol = pIdol ? Idols.getById(pIdol.idolId) : null;
                const info = idol ? `${idol.name}【${pIdol.title}】` : "";
                console.log(`${mem.name}\t${info}`);
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
