
import fs from "fs";
import path from "path";
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Adjust path to point to the correct location of json files
// The user edited files in /home/shigehiro/gakumas-tools/packages/gakumas-data/json/
const dataDir = path.join(__dirname, "../../packages/gakumas-data/json");

const pIdolsPath = path.join(dataDir, "p_idols.json");
const idolsPath = path.join(dataDir, "idols.json");

try {
    const pIdols = JSON.parse(fs.readFileSync(pIdolsPath, "utf8"));
    const idols = JSON.parse(fs.readFileSync(idolsPath, "utf8"));

    // Create a map for idol names
    const idolMap = idols.reduce((acc, idol) => {
        acc[idol.id] = idol.name;
        return acc;
    }, {});

    // CSV Header
    // Adding 'pIdolId' column (formerly 'id') as it's essential for the user's "dump-memories" task
    const header = '"pIdolId","idol","title","rarity","plan","recommendedEffect"';

    const rows = pIdols.map(pIdol => {
        const idolName = idolMap[pIdol.idolId] || "Unknown";
        // Escape quotes if necessary (though strictly not expected in this dataset, it's safe practice)
        // Wraps each field in double quotes
        return `"${pIdol.id}","${idolName}","${pIdol.title}","${pIdol.rarity}","${pIdol.plan}","${pIdol.recommendedEffect}"`;
    });

    const csvContent = [header, ...rows].join("\n");

    // Output file in the current directory or workspace root
    const outputPath = path.join(process.cwd(), "p_idols.csv");
    fs.writeFileSync(outputPath, csvContent, "utf8");

    console.log(`CSVファイルを生成しました: ${outputPath}`);

} catch (e) {
    console.error("エラーが発生しました:", e);
    process.exit(1);
}
