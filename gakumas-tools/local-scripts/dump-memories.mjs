
import { MongoClient } from "mongodb";
import { Idols, PIdols } from "gakumas-data";

const { MONGODB_URI, MONGODB_DB } = process.env;

if (!MONGODB_URI) {
    console.error("エラー: MONGODB_URI が設定されていません");
    process.exit(1);
}

const client = new MongoClient(MONGODB_URI);

const IDOL_ORDER = [
    "saki", "temari", "kotone",
    "mao", "lilja", "china",
    "sumika", "hiro", "rina",
    "ume", "sena", "misuzu", "tsubame"
];

const NAME_TO_ID = {
    "saki": 1, "temari": 2, "kotone": 3, "mao": 4, "lilja": 5, "china": 6,
    "sumika": 7, "hiro": 8, "rina": 9, "rinami": 9, "ume": 10, "sena": 11, "misuzu": 12, "tsubame": 13
};

async function run() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        console.log("使用法: ./local-run dump {<idolName>,all}");
        console.log("例: ./local-run dump kotone");
        console.log("例: ./local-run dump all");
        process.exit(1);
    }

    const target = args[0].toLowerCase();

    // Determine which idols to process
    let idolsToProcess = [];
    if (target === "all") {
        idolsToProcess = IDOL_ORDER;
    } else {
        if (!NAME_TO_ID[target]) {
            console.error(`エラー: アイドル名 '${target}' が見つかりません。`);
            process.exit(1);
        }
        idolsToProcess = [target];
    }

    try {
        await client.connect();
        const db = client.db(MONGODB_DB);
        const collection = db.collection("memories");

        // Pre-fetch all memories for efficiency if 'all', or just query per idol?
        // Querying per idol is fine for 13 queries. Only ~1000 items total.

        // Regex to parse name: YY/MM/DD[Sep]Score
        // Matches: Group 1 (Date), Group 2 (Score)
        const nameRegex = /^(\d{2}\/\d{2}\/\d{2})[ 　🔒🔑🛠️](\d+)$/u;

        console.log("--- メモリー一覧レポート ---");

        for (const idolKey of idolsToProcess) {
            const idolId = NAME_TO_ID[idolKey];
            const idolInfo = Idols.getById(idolId);
            const idolNameJp = idolInfo ? idolInfo.name : idolKey;

            // Get PIdol IDs for this Idol
            const pIdols = PIdols.getAll().filter(p => p.idolId === idolId);
            const pIdolIds = pIdols.map(p => p.id);

            if (pIdolIds.length === 0) continue;

            // Fetch Memories
            const memories = await collection.find({ pIdolId: { $in: pIdolIds } }).toArray();

            // Process Memories
            const parsedMemories = memories.map(m => {
                const match = m.name ? m.name.match(nameRegex) : null;
                if (match) {
                    return {
                        original: m,
                        date: match[1],
                        score: match[2],
                        sortKey: match[1] // Date string YY/MM/DD sorts correctly alphabetically
                    };
                } else {
                    // Fallback for invalid names
                    return {
                        original: m,
                        date: m.name || "Unknown",
                        score: "N/A",
                        sortKey: "00/00/00" // Bottom
                    };
                }
            });

            // Sort Descending (Newest date first)
            parsedMemories.sort((a, b) => {
                if (a.sortKey < b.sortKey) return 1;
                if (a.sortKey > b.sortKey) return -1;
                return 0;
            });

            // Statistics
            const total = parsedMemories.length;
            const quotient = Math.floor(total / 3);
            const remainder = total % 3;

            // Output Header
            console.log(`\n## ${idolNameJp}`);

            // Output Table
            console.log("| 1列目 | 2列目 | 3列目 |");
            console.log("| --: | --: | --: |");

            for (let i = 0; i < total; i += 3) {
                const rowItems = parsedMemories.slice(i, i + 3);
                const cells = rowItems.map(item => {
                    if (item.score === "N/A") return item.date; // Just print name if invalid
                    return `${item.date}<br>${item.score}`;
                });

                // Pad with empty cells if < 3
                while (cells.length < 3) {
                    cells.push("");
                }

                console.log(`| ${cells.join(" | ")} |`);
            }

            console.log(`\n合計 ${total} 枚 ( 3 × ${quotient} + ${remainder} )`);
        }

    } catch (e) {
        console.error("エラー:", e);
    } finally {
        await client.close();
    }
}

run();
