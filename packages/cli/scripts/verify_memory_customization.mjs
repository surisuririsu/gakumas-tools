
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

    // Search for memory
    // Name: "25/12/30 16515" (Note full width space potential)
    // Regex matching "16515" should be enough?
    const query = { name: { $regex: "16515" } };

    console.log("Searching for memory with '16515'...");
    const memory = await collection.findOne(query);

    if (!memory) {
        console.log("Memory not found!");
        await client.close();
        return;
    }

    console.log(`Found Memory: ${memory.name} (${memory._id})`);
    console.log(`IdolId: ${memory.idolId}`);

    // Check Card Customizations
    if (memory.cardCustomizations) {
        console.log("Card Customizations found:");
        // ID 133: Hinata Bokko+
        const targetCardId = "133";
        const customizations = memory.cardCustomizations[targetCardId];

        if (customizations) {
            console.log(`[Card 133] Hinata Bokko+ Customizations: ${JSON.stringify(customizations)}`);
            // ID 129: Wakuwaku+
            console.log(`[Card 129] Wakuwaku+ Customizations: ${JSON.stringify(memory.cardCustomizations["129"])}`);
        } else {
            console.log(`[Card 133] No customizations found for Hinata Bokko+.`);
        }

        console.log("All Customizations:", JSON.stringify(memory.cardCustomizations, null, 2));

    } else {
        console.log("No cardCustomizations field in memory.");
    }

    await client.close();
}

run().catch(console.error);
