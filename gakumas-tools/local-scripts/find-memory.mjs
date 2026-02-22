
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

// Load .env.local
const possiblePaths = [
    path.resolve(process.cwd(), '.env.local'),
    path.resolve(process.cwd(), '../.env.local'),
];

for (const p of possiblePaths) {
    if (fs.existsSync(p)) {
        console.log(`Loading env from ${p}`);
        const content = fs.readFileSync(p, 'utf-8');
        content.split('\n').forEach(line => {
            const match = line.match(/^([^=]+)=(.*)$/);
            if (match) {
                const key = match[1].trim();
                const val = match[2].trim().replace(/^["'](.*)["']$/, '$1');
                if (!process.env[key]) process.env[key] = val;
            }
        });
        break;
    }
}

async function run() {
    const uri = process.env.MONGODB_URI;
    if (!uri) {
        console.error("MONGODB_URI is not set");
        process.exit(1);
    }
    const client = new MongoClient(uri);
    await client.connect();
    const db = client.db(process.env.MONGODB_DB || "gakumas-tools");
    const collection = db.collection("memories");

    // Need to import from gakumas-data. Since this is ES module and package structure is complex,
    // we assume the environment is set up (yarn node handles it).
    // We'll dynamic import or assume global if possible, but better to import at top.
    // However, for this script, let's just use the DB to find what we look for if we can't easily import data.
    // Actually, optimize-memories-parallel.mjs imports them: import { Stages, PIdols, Idols } from "gakumas-data";
    // Using dynamic import here.

    // Note: In strict mode/ESM, we might need proper imports.
    // Let's rely on string matching in metadata if possible? No, we have IDs.
    // Let's try to import.

    const { SkillCards, PItems, PIdols } = await import("gakumas-data");

    const idol125 = PIdols.getById(125);
    console.log(`PID 125: ${idol125 ? idol125.name : "Unknown"} (IdolID: ${idol125 ? idol125.idolId : "?"})`);

    const terms = ["ひろがる", "広がる", "ミチナル"];

    let allMatchingCards = [];
    let allMatchingItems = [];

    for (const t of terms) {
        const matchingCards = SkillCards.getAll().filter(c => c.name.includes(t));
        const matchingItems = PItems.getAll().filter(i => i.name.includes(t));
        if (matchingCards.length > 0 || matchingItems.length > 0) {
            console.log(`Matches for '${t}':`);
            matchingCards.forEach(c => console.log(`Card: ${c.name} (ID: ${c.id})`));
            matchingItems.forEach(i => console.log(`Item: ${i.name} (ID: ${i.id})`));
            allMatchingCards.push(...matchingCards);
            allMatchingItems.push(...matchingItems);
        }
    }

    // Deduplicate cards and items
    const uniqueCardIds = new Set(allMatchingCards.map(c => c.id));
    const uniqueItemIds = new Set(allMatchingItems.map(i => i.id));
    const matchingCards = Array.from(uniqueCardIds).map(id => SkillCards.getById(id));
    const matchingItems = Array.from(uniqueItemIds).map(id => PItems.getById(id));

    console.log(`Found ${matchingCards.length} unique cards and ${matchingItems.length} unique items matching any of the terms`);

    const cardIds = matchingCards.map(c => c.id);
    const itemIds = matchingItems.map(i => i.id);

    matchingCards.forEach(c => console.log(`Card: ${c.name} (ID: ${c.id})`));
    matchingItems.forEach(i => console.log(`Item: ${i.name} (ID: ${i.id})`));

    if (cardIds.length === 0 && itemIds.length === 0) {
        console.log("No matching cards or items found.");
        return;
    }

    const query = {
        $or: [
            { skillCardIds: { $in: cardIds } },
            { pItemIds: { $in: itemIds } }
        ]
    };

    const memories = await collection.find(query).toArray();
    console.log(`Found ${memories.length} memories containing these cards/items:`);
    memories.forEach(m => {
        console.log(`- ${m.name} (ID: ${m._id}, PID: ${m.pIdolId})`);
    });

    await client.close();
}

run().catch(console.error);
