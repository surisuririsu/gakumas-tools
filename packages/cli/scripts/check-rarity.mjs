
import { SkillCards } from 'gakumas-data';

const cards = SkillCards.getAll();

const check = (name) => {
    const found = cards.filter(c => c.name === name || c.name === name + "+");
    found.forEach(c => {
        console.log(`Name: ${c.name}, Rarity: ${c.rarity}, ID: ${c.id}, Source: ${c.sourceType}`);
    });
};

check("私がスター");
check("私がスター+"); // Assuming the name in data has +
