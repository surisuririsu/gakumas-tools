import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "../../");
const jsonDir = path.join(projectRoot, "packages/gakumas-data/json");

const IDOL_NAME_TO_ID = {
    "kotone": 3,
};

function loadJson(name) {
    return JSON.parse(fs.readFileSync(path.join(jsonDir, name), "utf-8"));
}

function getCandidates(idolName, plan) {
    const idolId = IDOL_NAME_TO_ID[idolName];
    if (!idolId) {
        console.error("Unknown idol:", idolName);
        return;
    }

    console.log(`Idol: ${idolName} (ID: ${idolId}), Plan: ${plan}`);

    const SkillCards = loadJson("skill_cards.json");
    const PItems = loadJson("p_items.json");

    // Filter Skill Cards
    // Criteria:
    // - plan: 'free' or matches input plan
    // - sourceType: 'produce' (common cards) or 'pIdol' (signature)
    // - Exclude 'support' for now (assumed fixed or separate)
    const cards = SkillCards.filter(c => {
        const planMatch = c.plan === "free" || c.plan === plan;
        const idolMatch = c.sourceType === "produce" || (c.sourceType === "pIdol" && c.pIdolId && c.idolId === idolId) || (c.sourceType === "pIdol" && !c.pIdolId); // strict pIdol check?
        // Note: pIdol cards usually have pIdolId. If filtering by "Idol Name", we need pIdol mapping.
        // Actually, logic: 'pIdol' cards belong to a specific pIdol. 
        // If user says "Kotone", they probably mean "Any Kotone P-Idol" or a specific one? 
        // User said "specified idol".
        // Let's assume generic produce cards + any card that *could* belong to Kotone?
        // Or properly: Produce Cards + Specific P-Idol Signature. 
        // For "Combination of cards expelled in game", it usually refers to Produce Cards (Gacha/Event).
        return planMatch && c.sourceType === "produce";
    });

    console.log(`\nValid Produce Skill Cards: ${cards.length}`);
    cards.forEach(c => {
        // console.log(`- ${c.name} (${c.rarity}, ${c.plan})`);
    });

    // Filter P-Items
    const items = PItems.filter(i => {
        const planMatch = i.plan === "free" || i.plan === plan;
        // sourceType 'common' ??? Use 'produce'?
        // checked p_items.json, likely 'produce' or 'common' or just implicit.
        // Let's check a few types.
        return planMatch && (i.sourceType === "produce" || i.sourceType === "common");
    });

    // Check if PItems have 'produce' type
    const produceItems = PItems.filter(i => i.sourceType === "produce");
    console.log(`\nTotal Produce Items in DB: ${produceItems.length}`);

    const validItems = items.filter(i => i.sourceType === "produce");
    console.log(`Valid Produce P-Items (Plan matched): ${validItems.length}`);
}

getCandidates("kotone", "sense");
