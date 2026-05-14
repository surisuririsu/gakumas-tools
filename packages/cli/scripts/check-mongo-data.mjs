import { MongoClient } from "mongodb";

async function check() {
    const client = new MongoClient("mongodb://192.168.100.23:27017");
    await client.connect();
    const db = client.db("gakumas-tools");
    const collection = db.collection("memories");
    
    const memory = await collection.findOne({});
    console.log(JSON.stringify(memory, null, 2));
    
    await client.close();
}
check();
