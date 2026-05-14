
import { MongoClient } from "mongodb";
import fs from "fs";
import path from "path";

// Load environment variables from .env.local at the monorepo root
// Since we are in packages/cli/scripts/, we go up 3 levels to reach the root
const envPath = path.resolve("../../.env.local");
if (fs.existsSync(envPath)) {
    const envConfig = fs.readFileSync(envPath, "utf8");
    envConfig.split("\n").forEach(line => {
        const [key, ...values] = line.split("=");
        if (key && values.length > 0) {
            process.env[key.trim()] = values.join("=").trim().replace(/^["'](.*)["']$/, '$1');
        }
    });
}

const uri = process.env.MONGODB_URI;
const dbName = process.env.MONGODB_DB || "gakumas-tools";

if (!uri) {
    console.error("MONGODB_URI is not set in .env.local at root");
    process.exit(1);
}

async function run() {
    const client = new MongoClient(uri);
    try {
        await client.connect();
        const db = client.db(dbName);
        
        const collections = ["memories", "loadouts", "simulation_results"];
        
        console.log("=== Before Reset ===");
        const before = {};
        for (const colName of collections) {
            const count = await db.collection(colName).countDocuments();
            before[colName] = count;
            console.log(`${colName}: ${count}`);
        }

        console.log("\nResetting simulation_results...");
        const result = await db.collection("simulation_results").deleteMany({});
        console.log(`Deleted ${result.deletedCount} documents.`);

        console.log("\n=== After Reset ===");
        const after = {};
        for (const colName of collections) {
            const count = await db.collection(colName).countDocuments();
            after[colName] = count;
            console.log(`${colName}: ${count}`);
        }

        if (after.memories === before.memories && after.loadouts === before.loadouts && after.simulation_results === 0) {
            console.log("\n✅ Success: Only simulation_results was cleared.");
        } else {
            console.error("\n❌ Warning: Unexpected state detected!");
        }

    } catch (e) {
        console.error("Error during execution:", e);
    } finally {
        await client.close();
    }
}

run();
