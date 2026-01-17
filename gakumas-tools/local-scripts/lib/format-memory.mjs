
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

    // Skill Cards
    if (memory.skillCardIds && memory.skillCardIds.length > 0) {
        memory.skillCardIds.sort((a, b) => a - b).forEach(id => {
            const card = SkillCards.getById(id);
            const cardName = card ? card.name : `Unknown Card (${id})`;
            const rarity = card ? card.rarity : "?";
            // output += `- [${rarity}] ${cardName}\n`;
            // User requested simple list, maybe with rarity?
            // "200%スマイル+" implies name + upgrade status? (Upgrade is distinct ID)
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
