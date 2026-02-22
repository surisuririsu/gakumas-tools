import * as fs from 'fs';
import * as path from 'path';

const jsonPath = path.resolve(process.cwd(), '../gakumas-tools/packages/gakumas-data/json/skill_cards.json');
const data = JSON.parse(fs.readFileSync(jsonPath, 'utf-8'));

const targets = ["ひなたぼっこ", "あのときの約束", "叶えたい夢", "私は、決して", "私がスター", "執念キャッチャー", "ティーパーティ"];

targets.forEach(target => {
    const found = data.filter((c: any) => c.name.includes(target));
    console.log(`--- Search: ${target} ---`);
    found.forEach((c: any) => {
        console.log(`ID: ${c.id}, Name: ${c.name}, Rarity: ${c.rarity}, Type: ${c.type}`);
        // Try to print logical parameters if available, or just entire object if small
        console.log(JSON.stringify(c, null, 2));
    });
});
