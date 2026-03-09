import * as fs from 'fs';
import * as path from 'path';
import { SkillCards } from 'gakumas-data';

console.log("Test script starting...");

// Env loading
const envPath = path.resolve(process.cwd(), '../../gakumas-tools/.env.local');
console.log(`Checking env at: ${envPath}`);
if (fs.existsSync(envPath)) {
    console.log("Env file found.");
} else {
    console.log("Env file NOT found.");
}

try {
    const cards = SkillCards.getAll ? SkillCards.getAll() : (SkillCards as any).data;
    console.log(`Successfully loaded ${cards ? cards.length : 0} skill cards via gakumas-data.`);
} catch (e) {
    console.error("Failed to load skill cards:", e);
}
