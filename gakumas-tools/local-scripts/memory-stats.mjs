
import { MongoClient } from "mongodb";
import { PIdols, Idols } from "gakumas-data";

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

        console.error("MongoDBからメモリー情報を集計中...");

        // Aggregate by pIdolId
        const pipeline = [
            {
                $group: {
                    _id: "$pIdolId",
                    count: { $sum: 1 }
                }
            }
        ];

        const results = await collection.aggregate(pipeline).toArray();

        // Process results
        const statsByPlan = {
            "sense": 0,
            "logic": 0,
            "anomaly": 0,
            "unknown": 0
        };

        const statsByIdol = {};

        for (const res of results) {
            const pIdolId = res._id;
            const count = res.count;
            const pIdol = PIdols.getById(pIdolId);

            if (pIdol) {
                // Plan Stats
                if (statsByPlan[pIdol.plan] !== undefined) {
                    statsByPlan[pIdol.plan] += count;
                } else {
                    statsByPlan["unknown"] += count;
                }

                // Idol Stats
                const idol = Idols.getById(pIdol.idolId);
                const idolName = idol ? idol.name : "Unknown";

                if (!statsByIdol[idolName]) {
                    statsByIdol[idolName] = 0;
                }
                statsByIdol[idolName] += count;
            } else {
                statsByPlan["unknown"] += count;
            }
        }

        console.log("### プラン別集計 (CSV)");
        console.log("Plan,Count");
        for (const [plan, count] of Object.entries(statsByPlan)) {
            if (count > 0) console.log(`${plan},${count}`);
        }

        console.log("\n### アイドル別集計 (CSV)");
        console.log("Idol,Count");
        // Sort by count desc
        const sortedIdols = Object.entries(statsByIdol).sort((a, b) => b[1] - a[1]);
        for (const [idol, count] of sortedIdols) {
            console.log(`${idol},${count}`);
        }

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
