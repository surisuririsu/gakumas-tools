
import { MongoClient } from "mongodb";
import { PIdols, Idols } from "gakumas-data";

const IDOL_ORDER = [
    "saki", "temari", "kotone",
    "tsubame", // 13
    "mao",     // 4
    "lilja", "china",
    "sumika", "hiro", "sena",
    "misuzu", "ume", "rinami"
];

const NAME_TO_ID = {
    "saki": 1, "temari": 2, "kotone": 3, "tsubame": 13,
    "mao": 4, "lilja": 5, "china": 6,
    "sumika": 7, "hiro": 8, "sena": 11,
    "misuzu": 12, "ume": 10, "rinami": 9, "rina": 9
};

// Japanese Plan Name Mapping
const PLAN_NAME = {
    "sense": "センス",
    "logic": "ロジック",
    "anomaly": "アノマリー"
};

async function run() {
    const uri = process.env.MONGODB_URI;
    const dbName = process.env.MONGODB_DB;

    if (!uri) {
        console.error("エラー: MONGODB_URI が設定されていません。.env.local を確認してください。");
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection("memories");

        // Simple aggregation by pIdolId
        const pipeline = [
            {
                $group: {
                    _id: "$pIdolId",
                    count: { $sum: 1 }
                }
            }
        ];

        const results = await collection.aggregate(pipeline).toArray();

        // Initialize Matrix
        // structure: stats[idolKey] = { sense: 0, logic: 0, anomaly: 0, total: 0 }
        const stats = {};
        for (const key of IDOL_ORDER) {
            stats[key] = { sense: 0, logic: 0, anomaly: 0, total: 0 };
        }

        // Processing Results
        for (const res of results) {
            const pIdolId = res._id;
            const count = res.count;
            const pIdol = PIdols.getById(pIdolId);

            if (!pIdol) continue; // Unknown P-Idol

            // Find Idol Key (English) from ID
            const idolId = pIdol.idolId;
            const idolKey = Object.keys(NAME_TO_ID).find(key => NAME_TO_ID[key] === idolId && key !== 'rina'); // prefer rinami key or main key

            // Just use the first matching key from our orderly list to be safe
            const targetKey = IDOL_ORDER.find(k => NAME_TO_ID[k] === idolId);

            if (targetKey && stats[targetKey]) {
                const plan = pIdol.plan; // "sense", "logic", "anomaly"
                if (stats[targetKey][plan] !== undefined) {
                    stats[targetKey][plan] += count;
                    stats[targetKey].total += count;
                }
            }
        }

        // Output Markdown Table
        console.log("# メモリー統計情報");
        console.log("| アイドル | センス | ロジック | アノマリー | 計 |");
        console.log("| :-- | --: | --: | --: | --: |");

        // Column Totals
        let totalSense = 0;
        let totalLogic = 0;
        let totalAnomaly = 0;
        let grandTotal = 0;

        for (const key of IDOL_ORDER) {
            const row = stats[key];
            const idolId = NAME_TO_ID[key];
            const idolInfo = Idols.getById(idolId);
            const idolNameJp = idolInfo ? idolInfo.name.replace(/\s+/g, ' ') : key; // Ensure single space if needed, or stick to data

            console.log(`| ${idolNameJp} | ${row.sense} | ${row.logic} | ${row.anomaly} | ${row.total} |`);

            totalSense += row.sense;
            totalLogic += row.logic;
            totalAnomaly += row.anomaly;
            grandTotal += row.total;
        }

        console.log(`| 計 | ${totalSense} | ${totalLogic} | ${totalAnomaly} | ${grandTotal} |`);

    } catch (e) {
        console.error("エラー:", e);
    } finally {
        await client.close();
    }
}

// Prevent crash on pipe/stream errors
[process.stdout, process.stderr].forEach(stream => {
    stream.on('error', (err) => {
        if (err.code === 'EPIPE' || err.code === 'ETIMEDOUT') return;
    });
});

run();
