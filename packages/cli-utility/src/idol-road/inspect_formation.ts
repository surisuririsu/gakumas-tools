import { Database } from './db';
import * as fs from 'fs';
import * as path from 'path';

// Load Skill Cards Master Data
export const loadSkillCards = (): any[] => {
    const jsonPath = path.resolve(process.cwd(), '../gakumas-tools/packages/gakumas-data/json/skill_cards.json');
    if (!fs.existsSync(jsonPath)) {
        console.error(`Skill cards not found at ${jsonPath}`);
        return [];
    }
    return JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));
};

export const getCombinedDeck = async (db: Database, targets: string[]): Promise<any[]> => {
    const masterData = loadSkillCards();
    const cardMap = new Map(masterData.map((c: any) => [c.id, c]));

    console.log("=== Inspecting Combined Deck (Unique Regulation) ===\n");

    let pool: any[] = [];

    // 1. Collect all cards
    for (const target of targets) {
        const memories = await db.client?.db(process.env.MONGODB_DB || 'gakumas-tools')
            .collection('memories')
            .find({ name: { $regex: target } })
            .toArray();

        if (!memories || memories.length === 0) {
            console.log(`[WARN] Memory not found: "${target}"`);
            continue;
        }
        const memory = memories[0];
        console.log(`[LOAD] Memory: ${memory.name} (P-Idol: ${memory.pIdolId})`);

        const cardIds = memory.skillCardIds || [];
        cardIds.forEach((id: number) => {
            const card = cardMap.get(id);
            if (card) pool.push(card);
        });
    }

    console.log(`\nTotal Cards Pooled: ${pool.length}`);

    // 2. Filter Unique Cards
    const finalDeck: any[] = [];
    const uniqueMap = new Map<string, any>(); // BaseName -> Best Card

    // Helper to get base name (remove +)
    const getBaseName = (name: string) => name.replace(/\+$/, '');

    for (const card of pool) {
        if (!card.unique) {
            // Keep all non-unique? 
            // Usually regular PLv cards are unique too in deck rules (can't have duplicate IDs).
            // But if they are physically different cards (different IDs) but same name?
            // "Unique" flag is the strict rule.
            finalDeck.push(card);
        } else {
            const baseName = getBaseName(card.name);
            const existing = uniqueMap.get(baseName);

            if (!existing) {
                uniqueMap.set(baseName, card);
            } else {
                // Conflict. Check upgrade status.
                const isExistingPlus = existing.name.endsWith('+');
                const isNewPlus = card.name.endsWith('+');

                if (!isExistingPlus && isNewPlus) {
                    // Upgrade!
                    uniqueMap.set(baseName, card);
                }
                // If existing is Plus, keep it.
                // If both are same, keep existing (or arbitrary).
            }
        }
    }

    // Add unique cards
    uniqueMap.forEach((card) => finalDeck.push(card));

    return finalDeck;
};

const main = async () => {
    const db = new Database();
    await db.connect();

    const targets = [
        "25/08/16　16248",
        "25/10/06　15984",
        "25/08/20　16194",
        "25/08/21　16308"
    ];

    const finalDeck = await getCombinedDeck(db, targets);

    console.log(`\n=== Final Deck Structure (${finalDeck.length} Cards) ===`);

    // Sort
    const rarityOrder: { [key: string]: number } = { 'SSR': 3, 'SR': 2, 'R': 1, 'N': 0 };
    finalDeck.sort((a, b) => {
        const diff = rarityOrder[b.rarity] - rarityOrder[a.rarity];
        if (diff !== 0) return diff;
        return a.name.localeCompare(b.name);
    });

    finalDeck.forEach(c => {
        console.log(`- [${c.rarity}] ${c.name} (Unique: ${c.unique})`);
    });

    await db.close();
};

main().catch(console.error);
