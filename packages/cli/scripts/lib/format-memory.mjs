
import { Idols, PIdols, PItems, SkillCards } from "gakumas-data";

/**
 * Formats a memory object for display
 * @param {Object} memory - Memory object (flat schema)
 * @returns {string} - Formatted string
 */
export function formatMemory(memory) {
    const pIdol = PIdols.getById(memory.pIdolId);
    const idol = pIdol ? Idols.getById(pIdol.idolId) : null;

    // Construct Title: [Idol Name] [P-Idol Name] - (Memory Name)
    const idolName = idol ? idol.name : "Unknown Idol";
    const pIdolName = pIdol ? `【${pIdol.title}】` : "【Unknown P-Idol】";
    const memName = memory.name || "No Name";

    let output = `### ${idolName}${pIdolName} - (${memName})\n`;

    // P-Items
    output += `#### Pアイテム\n`;
    if (memory.pItemIds && memory.pItemIds.length > 0) {
        const validItems = memory.pItemIds.filter(id => id !== 0 && id != null);
        if (validItems.length > 0) {
            validItems.forEach(id => {
                const item = PItems.getById(id);
                const itemName = item ? item.name : `Unknown Item (${id})`;
                output += `- ${itemName}\n`;
            });
        } else {
            output += `- (No P-Items)\n`;
        }
    } else {
        output += `- (No P-Items)\n`;
    }

    // Skill Cards
    output += `#### スキルカード\n`;
    if (memory.skillCardIds && memory.skillCardIds.length > 0) {
        memory.skillCardIds.sort((a, b) => {
            const cardA = SkillCards.getById(a);
            const cardB = SkillCards.getById(b);
            if (!cardA) return 1;
            if (!cardB) return -1;

            // Priority: Unique (pIdol) < Support (support) < Regular (others)
            const typePriority = { pIdol: 0, support: 1 };
            const typeA = typePriority[cardA.sourceType] ?? 2;
            const typeB = typePriority[cardB.sourceType] ?? 2;

            if (typeA !== typeB) return typeA - typeB;

            // Rarity: R < SR < SSR (for Regular/Support)
            const rarityPriority = { R: 0, SR: 1, SSR: 2 };
            const rarityA = rarityPriority[cardA.rarity] ?? 0;
            const rarityB = rarityPriority[cardB.rarity] ?? 0;

            if (rarityA !== rarityB) return rarityA - rarityB;

            return a - b; // fallback to ID
        }).forEach(id => {
            const card = SkillCards.getById(id);
            const cardName = card ? card.name : `Unknown Card (${id})`;
            // const rarity = card ? card.rarity : "?";
            output += `- ${cardName}\n`;
        });
    } else {
        output += `- (No Skills)\n`;
    }

    // Params (Optional, but user didn't explicitly ask for it in the bullet list, 
    // but useful context if stats differ)
    const totalStats = (memory.params || []).slice(0, 3).reduce((acc, v) => acc + (v || 0), 0);
    // output += `  (Assess: ${totalStats})\n`;

    return output;
}
