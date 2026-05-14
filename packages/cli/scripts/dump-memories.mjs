
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";
import { PIdols, Idols } from "gakumas-data";

const { MONGODB_URI, MONGODB_DB } = process.env;

if (!MONGODB_URI) {
    console.error("エラー: MONGODB_URI が設定されていません");
    process.exit(1);
}

const client = new MongoClient(MONGODB_URI);

const IDOL_ORDER = [
    "saki", "temari", "kotone",
    "tsubame",
    "mao",
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

// Helper: Parse memory name "26/01/17 15480" -> Date, Score, Markers
function parseMemoryName(name) {
    // Regex for: YY/MM/DD [markers] Score
    // Markers might be 🛠️ (hammer), 🔑 (key), or spaces
    // Example: "25/08/28　🛠️14502" or "26/01/17　15480"
    // Note: The user uses full-width space often.

    const dateMatch = name.match(/^(\d{2}\/\d{2}\/\d{2})/);
    if (!dateMatch) return null;

    const dateStr = dateMatch[1];

    // Extract everything after date
    let remainder = name.substring(dateStr.length).trim();

    // Markers
    let prefix = "";
    if (remainder.includes("🛠️")) prefix += "🛠️";
    if (remainder.includes("🔑")) prefix += "🔑";

    // Extract Score (digits at end)
    const scoreMatch = remainder.match(/(\d+)$/);
    const score = scoreMatch ? parseInt(scoreMatch[1], 10) : 0;

    return {
        originalName: name,
        dateStr,
        score,
        prefix,
        // For sorting: YY/MM/DD -> YYYYMMDD equivalent (or just ISO string for comparison)
        // 25/01/17 -> 2025-01-17
        sortDate: `20${dateStr.split('/').join('-')}`
    };
}

async function run() {
    const args = process.argv.slice(2);

    let targetIdolKey = "all";
    let outputFile = "stdout";

    if (args.length > 0) {
        targetIdolKey = args[0].toLowerCase();
    }
    if (args.length > 1) {
        outputFile = args[1];
    }

    // Handle "dump.md" passed as first arg if user skips idol name? 
    // CLI logic: dump [idolName] [outputFile]
    // If user types `dump dump.md`, idolName="dump.md".
    // We should probably check if arg[0] is an idol name.

    if (!IDOL_ORDER.includes(targetIdolKey) && targetIdolKey !== "all") {
        // Assume arg[0] might be output file if it ends in .md, or explicit error?
        // Let's rely on documentation saying "dump [idolName]".
        // But be nice: if arg[0] ends in .md, treat as all + output file
        if (targetIdolKey.endsWith('.md')) {
            outputFile = targetIdolKey;
            targetIdolKey = "all";
        }
    }

    try {
        await client.connect();
        const db = client.db(MONGODB_DB);
        const collection = db.collection("memories");

        let reportContent = "# メモリー一覧レポート\n---\n- ソート: 入手\n- フィルタ: 「プロデュース」以外のタグ\n---\n\n";

        const idolsToProcess = targetIdolKey === "all" ? IDOL_ORDER : [targetIdolKey];

        for (const key of idolsToProcess) {
            const idolId = NAME_TO_ID[key];
            if (!idolId) continue;

            const idolInfo = Idols.getById(idolId);
            const idolNameJp = idolInfo ? idolInfo.name.replace(/\s+/g, ' ') : key;

            // Get PIdol IDs for this idol
            const pIdols = PIdols.getAll().filter(p => p.idolId === idolId);
            const pIdolIds = pIdols.map(p => p.id);

            // Fetch memories
            const rawMemories = await collection.find({ pIdolId: { $in: pIdolIds } }).toArray();

            // Filter and Parse
            const parsedMemories = [];
            for (const mem of rawMemories) {
                // Determine if "Produce" tag? User said "Filter: 'Produce' other tags". 
                // Usually all memories in DB are from production.
                // Assuming all DB entries are valid for now.

                // Parse Name
                const parsed = parseMemoryName(mem.name || "");
                if (parsed) {
                    parsedMemories.push(parsed);
                } else {
                    // Fallback for weird names?
                    // console.warn("Could not parse name:", mem.name);
                }
            }

            // Sort: Date Descending, then Score Descending
            parsedMemories.sort((a, b) => {
                if (a.sortDate !== b.sortDate) {
                    return b.sortDate.localeCompare(a.sortDate);
                }
                return b.score - a.score;
            });

            const total = parsedMemories.length;
            const rows = Math.ceil(total / 3); // 3 columns
            // Header format: "花海 咲季: 合計 34 枚 ( 3 × 11 + 1 )"
            // N = floor(total / 3), R = total % 3
            const N = Math.floor(total / 3);
            const R = total % 3;
            const remainderStr = R > 0 ? ` + ${R}` : "";

            reportContent += `## ${idolNameJp}: 合計 ${total} 枚 ( 3 × ${N}${remainderStr} )\n`;
            reportContent += `| | 1列目 | 2列目 | 3列目 |\n`;
            reportContent += `| --: | --: | --: | --: |\n`;

            for (let r = 0; r < rows; r++) {
                const cell1 = parsedMemories[r * 3];
                const cell2 = parsedMemories[r * 3 + 1];
                const cell3 = parsedMemories[r * 3 + 2];

                const c1Str = cell1 ? `${cell1.dateStr}<br>${cell1.prefix}${cell1.score}` : "";
                const c2Str = cell2 ? `${cell2.dateStr}<br>${cell2.prefix}${cell2.score}` : "";
                const c3Str = cell3 ? `${cell3.dateStr}<br>${cell3.prefix}${cell3.score}` : "";

                reportContent += `| ${r + 1} | ${c1Str} | ${c2Str} | ${c3Str} |\n`;
            }
            reportContent += "\n";
        }

        // Output logic
        if (outputFile === "stdout" || outputFile === "-") {
            console.log(reportContent);
        } else {
            const outputPath = path.resolve(process.cwd(), outputFile);
            fs.writeFileSync(outputPath, reportContent, "utf8");
            console.log(`Saved report to ${outputFile}`);
        }

    } catch (e) {
        console.error("エラー:", e);
        process.exit(1);
    } finally {
        await client.close();
    }
}

run();
