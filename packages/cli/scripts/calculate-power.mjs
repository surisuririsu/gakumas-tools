
import { PItems, SkillCards } from "gakumas-data";
import fs from "fs";
import path from "path";

function countCustomizations(customizations) {
    if (!customizations) return 0;
    return Object.values(customizations).reduce((acc, cur) => acc + cur, 0);
}

function calculateContestPower(params, pItemIds, skillCardIds, customizations) {
    const [vocal, dance, visual, stamina] = params.map((p) => p || 0);
    // Formula copied from gakumas-tools/utils/contestPower.js
    // Note: Cannot import directly due to Next.js/Node module resolution differences (ESM vs CJS)
    const paramPower = 3 * (vocal + dance + visual) + 24 * stamina;

    const pItems = pItemIds.filter((p) => !!p).map(PItems.getById);
    const pItemPower = pItems.reduce((acc, cur) => acc + (cur?.contestPower || 0), 0);

    const skillCards = skillCardIds.filter((s) => !!s).map(SkillCards.getById);
    const skillCardPower = skillCards.reduce(
        (acc, cur) => acc + (cur?.contestPower || 0),
        0
    );

    const customizationPower = (customizations || []).reduce(
        (acc, cur) => acc + countCustomizations(cur) * 36,
        0
    );

    return paramPower + pItemPower + skillCardPower + customizationPower;
}

const args = process.argv.slice(2);
if (args.length < 1) {
    console.log("使用法: yarn node local-scripts/calculate-power.mjs <memory_file>");
    process.exit(1);
}

const memoryPath = args[0];
if (!fs.existsSync(memoryPath)) {
    console.error(`ファイルが見つかりません: ${memoryPath}`);
    process.exit(1);
}

const memory = JSON.parse(fs.readFileSync(memoryPath, "utf8"));

// 1. Prepare Data
let params = memory.params;
let pItemIds = [...memory.pItemIds];
let skillCardIds = [...memory.skillCardIds];
let customizations = memory.customizations || [{}, {}, {}, {}, {}, {}];

// 2. Inject P-Idol Signature Items/Cards
// (Note: The GUI calculator does NOT inject signature items, so we skip it to match the display value)


// 3. Calculate
const power = calculateContestPower(params, pItemIds, skillCardIds, customizations);

console.log("---------------------------------------------------");
console.log(`ファイル: ${path.basename(memoryPath)}`);
console.log(`メモリー名: ${memory.name || "不明"}`);
console.log(`PアイドルID: ${memory.pIdolId}`);
console.log("---------------------------------------------------");
console.log(`ステージ総合力: ${power}`);
console.log("---------------------------------------------------");
