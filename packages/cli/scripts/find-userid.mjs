import { MongoClient } from "mongodb";
import "dotenv/config";

async function run() {
  const uri = process.env.MONGODB_URI;
  const dbName = process.env.MONGODB_DB || "gakumas-tools";

  if (!uri) {
    console.error("Error: MONGODB_URI is not set in environment.");
    process.exit(1);
  }

  const client = new MongoClient(uri);

  try {
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection("loadouts");

    console.log(`Connecting to database: ${dbName}...`);

    // Get unique userIds and one example loadout name for each
    const users = await collection.aggregate([
      {
        $group: {
          _id: "$userId",
          loadoutCount: { $sum: 1 },
          exampleName: { $first: "$name" },
          lastUsed: { $max: "$createdAt" }
        }
      },
      { $sort: { lastUsed: -1 } }
    ]).toArray();

    if (users.length === 0) {
      console.log("No loadouts found in the database. You might not have saved any yet via the Web UI.");
      return;
    }

    console.log("\nFound the following userIds in the 'loadouts' collection:");
    console.log("------------------------------------------------------------");
    console.log("| User ID (Discord ID)    | Loadouts | Example Loadout Name");
    console.log("------------------------------------------------------------");

    users.forEach(u => {
      const id = String(u._id).padEnd(25);
      const count = String(u.loadoutCount).padStart(8);
      console.log(`| ${id} | ${count} | ${u.exampleName || 'No Name'}`);
    });

    console.log("------------------------------------------------------------");
    console.log("\nNote: This tool uses Discord IDs as user IDs.");
    console.log("If you see your loadout name in the list, the corresponding User ID is the one you should use.");

  } catch (err) {
    console.error("MongoDB Error:", err);
  } finally {
    await client.close();
  }
}

run();
