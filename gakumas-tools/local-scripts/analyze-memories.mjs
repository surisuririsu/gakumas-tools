import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper to load JSON data directly to avoid ESM resolution issues in local-run
function loadData() {
    // Determine path to packages/gakumas-data/json
    // We are in gakumas-tools/local-scripts
    // Data is in packages/gakumas-data/json
    const projectRoot = path.resolve(__dirname, "../../");
    const jsonDir = path.join(projectRoot, "packages/gakumas-data/json");

    try {
        const idolsData = JSON.parse(fs.readFileSync(path.join(jsonDir, "idols.json"), "utf-8"));
        const pIdolsData = JSON.parse(fs.readFileSync(path.join(jsonDir, "p_idols.json"), "utf-8"));

        const idolsById = idolsData.reduce((acc, cur) => { acc[cur.id] = cur; return acc; }, {});
        const pIdolsById = pIdolsData.reduce((acc, cur) => { acc[cur.id] = cur; return acc; }, {});

        return {
            Idols: {
                getById: (id) => idolsById[id]
            },
            PIdols: {
                getById: (id) => pIdolsById[id]
            }
        };
    } catch (e) {
        console.warn("Warining: Could not load data from gakumas-data/json. Ensure you are running from the project root.", e.message);
        return {
            Idols: { getById: () => null },
            PIdols: { getById: () => null }
        }
    }
}

const { Idols, PIdols } = loadData();

async function run() {
    const args = process.argv.slice(2);
    const uri = args[0];

    if (!uri) {
        console.error("エラー: MongoDB URIが指定されていません。");
        process.exit(1);
    }

    const client = new MongoClient(uri);

    try {
        await client.connect();
        const db = client.db();
        const collection = db.collection("memories");

        // info: pIdolId isn't indexed usually but for 1000 items it's fast enough.
        // Aggregate: Group by pIdolId and count
        const pipeline = [
            {
                $group: {
                    _id: "$pIdolId",
                    count: { $sum: 1 }
                }
            }
        ];

        const results = await collection.aggregate(pipeline).toArray();
        const totalCount = results.reduce((acc, curr) => acc + curr.count, 0);

        // Enrich data
        const rows = results.map(r => {
            const pIdolId = r._id;
            const pIdol = PIdols.getById(pIdolId);
            if (!pIdol) {
                return {
                    idolName: "Unknown",
                    title: `Unknown (ID:${pIdolId})`,
                    plan: "-",
                    count: r.count,
                    idolId: 999
                };
            }

            const idol = Idols.getById(pIdol.idolId);
            const idolName = idol ? idol.name.replace(" ", "") : "Unknown";

            // Map plan to Japanese
            const planMap = {
                "sense": "センス",
                "logic": "ロジック",
                "anomaly": "アノマリー"
            };
            const planJa = planMap[pIdol.plan] || pIdol.plan;

            return {
                idolName: idolName,
                title: pIdol.title,
                plan: planJa,
                count: r.count,
                idolId: pIdol.idolId // For sorting
            };
        });

        // Sort: Idol ID -> Plan -> Title
        rows.sort((a, b) => {
            if (a.idolId !== b.idolId) return a.idolId - b.idolId;
            if (a.plan !== b.plan) return a.plan.localeCompare(b.plan);
            return a.title.localeCompare(b.title);
        });

        // Output Markdown
        console.log(`## メモリー統計 (合計: ${totalCount} 件)`);
        console.log("");
        console.log("| アイドル名 | 楽曲名 | プラン名 | 枚数 |");
        console.log("| :-- | :-- | :-- | --: |");

        rows.forEach(row => {
            console.log(`| ${row.idolName} | ${row.title} | ${row.plan} | ${row.count} |`);
        });

    } catch (e) {
        console.error("エラーが発生しました:", e);
    } finally {
        await client.close();
    }
}

run();
