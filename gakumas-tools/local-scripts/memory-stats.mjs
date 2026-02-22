
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

        const stats = {};
        for (const key of IDOL_ORDER) {
            stats[key] = { sense: 0, logic: 0, anomaly: 0, total: 0 };
        }

        // Check for Idol Name Argument
        const args = process.argv.slice(2);

        // Manual arg parsing for --json
        const jsonMode = args.includes('--json');

        // Capture console.log if in json mode
        const originalConsoleLog = console.log;
        if (jsonMode) {
            console.log = () => { };
        }

        let targetIdolId = null;
        let targetIdolName = "";
        let targetIdolKey = "";

        // Filter out flags from args for positional processing
        const positionalArgs = args.filter(a => !a.startsWith('--'));

        if (positionalArgs.length > 0) {
            const arg = positionalArgs[0].toLowerCase();
            if (arg === "all") {
                // handled below
            } else if (NAME_TO_ID[arg]) {
                targetIdolId = NAME_TO_ID[arg];
                targetIdolKey = arg;
                const idolInfo = Idols.getById(targetIdolId);
                targetIdolName = idolInfo ? idolInfo.name.replace(/\s+/g, ' ') : arg;
            } else {
                console.error(`エラー: アイドル名 '${arg}' が見つかりません。`);
                process.exit(1);
            }
        }

        // Helper function for generating stats for a single idol
        const generateIdolStats = async (idolId, idolName) => {
            const pIdols = PIdols.getAll().filter(p => p.idolId === idolId);
            const pIdolIds = pIdols.map(p => p.id);

            const idolMemories = await collection.find({ pIdolId: { $in: pIdolIds } }).toArray();

            const songStats = [];

            for (const mem of idolMemories) {
                const pIdol = PIdols.getById(mem.pIdolId);
                if (!pIdol) continue;

                const plan = pIdol.plan;
                const title = pIdol.title;

                let entry = songStats.find(s => s.plan === plan && s.title === title);
                if (!entry) {
                    entry = { plan, title, count: 0 };
                    songStats.push(entry);
                }
                entry.count++;
            }

            const planOrder = { "sense": 1, "logic": 2, "anomaly": 3 };
            songStats.sort((a, b) => {
                if (planOrder[a.plan] !== planOrder[b.plan]) {
                    return planOrder[a.plan] - planOrder[b.plan];
                }
                return a.title.localeCompare(b.title, 'ja');
            });

            const grandTotal = idolMemories.length;

            if (jsonMode) {
                // Return data structure instead of printing
                return {
                    idolName: idolName,
                    total: grandTotal,
                    breakdown: songStats.map(s => ({
                        plan: s.plan,
                        planName: PLAN_NAME[s.plan] || s.plan,
                        title: s.title,
                        count: s.count,
                        percent: ((s.count / grandTotal) * 100).toFixed(1)
                    }))
                };
            }

            console.log(`# メモリー統計情報 (${idolName})`);
            console.log("| プラン | 楽曲 | 枚数 |");
            console.log("| :-- | :-- | --: |");

            const fmt = (val, total) => {
                if (total === 0) return "0<br>0.0%";
                const pct = ((val / total) * 100).toFixed(1);
                return `${val}<br>${pct}%`;
            };

            for (const entry of songStats) {
                const planName = PLAN_NAME[entry.plan] || entry.plan;
                const valCell = fmt(entry.count, grandTotal);
                console.log(`| ${planName} | ${entry.title} | ${valCell} |`);
            }

            const totalCell = fmt(grandTotal, grandTotal);
            console.log(`| 計 | | ${totalCell} |`);
            console.log(""); // Empty line for separation
        };

        if (targetIdolId) {
            const data = await generateIdolStats(targetIdolId, targetIdolName);
            if (jsonMode) {
                originalConsoleLog(JSON.stringify({ type: 'idol', data }));
            }
        } else if (positionalArgs.length > 0 && positionalArgs[0].toLowerCase() === 'all') {
            const allData = [];
            for (const key of IDOL_ORDER) {
                const idolId = NAME_TO_ID[key];
                const idolInfo = Idols.getById(idolId);
                const idolName = idolInfo ? idolInfo.name.replace(/\s+/g, ' ') : key;
                const data = await generateIdolStats(idolId, idolName);
                if (jsonMode) allData.push(data);
            }
            if (jsonMode) {
                // If 'all', we return a special type "all_idols" which contains an array of idol data
                originalConsoleLog(JSON.stringify({ type: 'all_idols', data: allData }));
            }
        } else if (false) {
            // Placeholder to keep the else if structure if needed, but we jump to else
        } else {
            // --- Overall Stats (Original Logic) ---

            const results = await collection.aggregate(pipeline).toArray();

            // Processing Results
            for (const res of results) {
                const pIdolId = res._id;
                const count = res.count;
                const pIdol = PIdols.getById(pIdolId);

                if (!pIdol) continue; // Unknown P-Idol

                // Find Idol Key (English) from ID
                const idolId = pIdol.idolId;
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

            if (jsonMode) {
                const overallData = IDOL_ORDER.map(key => {
                    const row = stats[key];
                    const idolId = NAME_TO_ID[key];
                    const idolInfo = Idols.getById(idolId);
                    const idolNameJp = idolInfo ? idolInfo.name.replace(/\s+/g, ' ') : key;
                    return {
                        idolName: idolNameJp,
                        sense: row.sense,
                        logic: row.logic,
                        anomaly: row.anomaly,
                        total: row.total
                    };
                });

                // Calculate totals
                let totalSense = 0, totalLogic = 0, totalAnomaly = 0, grandTotal = 0;
                overallData.forEach(d => {
                    totalSense += d.sense;
                    totalLogic += d.logic;
                    totalAnomaly += d.anomaly;
                    grandTotal += d.total;
                });

                originalConsoleLog(JSON.stringify({
                    type: 'overall',
                    data: overallData,
                    totals: {
                        sense: totalSense,
                        logic: totalLogic,
                        anomaly: totalAnomaly,
                        grandTotal: grandTotal
                    }
                }));
            } else {

                // Output Markdown Table
                console.log("# メモリー統計情報");
                console.log("| アイドル | センス | ロジック | アノマリー | 計 |");
                console.log("| :-- | --: | --: | --: | --: |");

                // Calculate Totals First
                let totalSense = 0;
                let totalLogic = 0;
                let totalAnomaly = 0;
                let grandTotal = 0;

                for (const key of IDOL_ORDER) {
                    const row = stats[key];
                    totalSense += row.sense;
                    totalLogic += row.logic;
                    totalAnomaly += row.anomaly;
                    grandTotal += row.total;
                }

                // Helper to format cell with percentage
                const fmt = (val, total) => {
                    if (total === 0) return "0<br>0.0%";
                    const pct = ((val / total) * 100).toFixed(1);
                    return `${val}<br>${pct}%`;
                };

                // Output Rows
                for (const key of IDOL_ORDER) {
                    const row = stats[key];
                    const idolId = NAME_TO_ID[key];
                    const idolInfo = Idols.getById(idolId);
                    const idolNameJp = idolInfo ? idolInfo.name.replace(/\s+/g, ' ') : key;

                    const senseCell = fmt(row.sense, grandTotal);
                    const logicCell = fmt(row.logic, grandTotal);
                    const anomalyCell = fmt(row.anomaly, grandTotal);
                    const totalCell = fmt(row.total, grandTotal);

                    console.log(`| ${idolNameJp} | ${senseCell} | ${logicCell} | ${anomalyCell} | ${totalCell} |`);
                }

                const totalSenseCell = fmt(totalSense, grandTotal);
                const totalLogicCell = fmt(totalLogic, grandTotal);
                const totalAnomalyCell = fmt(totalAnomaly, grandTotal);
                const grandTotalCell = fmt(grandTotal, grandTotal);

                console.log(`| 計 | ${totalSenseCell} | ${totalLogicCell} | ${totalAnomalyCell} | ${grandTotalCell} |`);
            }
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
