
try {
    const StageEngine = require('gakumas-engine/engine/StageEngine');
    const { S } = require('gakumas-engine/constants');
    console.log("StageEngine loaded:", !!StageEngine);
    console.log("S loaded:", !!S);
    console.log("S.stamina:", S.stamina);
} catch (e) {
    console.error("Import failed:", e);
}
