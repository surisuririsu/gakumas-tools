
import { PIdols } from "gakumas-data";

const idolName = "mao";
const plan = "anomaly";

const nameToId = {
    "saki": 1, "temari": 2, "kotone": 3, "mao": 4, "lilja": 5, "china": 6,
    "sumika": 7, "hiro": 8, "rina": 9, "rinami": 9, "ume": 10, "sena": 11, "misuzu": 12, "tsubame": 13
};

const idolId = nameToId[idolName];
console.log(`Idol Name: ${idolName} -> ID: ${idolId}`);

let targetPIdols = PIdols.getAll().filter(p => p.idolId === idolId);
console.log(`PIdols matching Idol ID: ${targetPIdols.length}`);

if (plan && plan !== "all") {
    targetPIdols = targetPIdols.filter(p => p.plan === plan);
}

const pIdolIds = targetPIdols.map(p => p.id);
console.log(`Target PIdol IDs: ${pIdolIds.join(", ")}`);
