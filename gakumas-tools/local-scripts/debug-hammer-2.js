
const logOutput = "26/01/27⚒️15645"; // From user log
const userChar = "🛠️"; // From user message

console.log("Log output char code:");
for (let i = 0; i < logOutput.length; i++) {
    console.log(`${logOutput[i]}: ${logOutput.codePointAt(i).toString(16)}`);
}

console.log("\nUser message char code:");
for (let i = 0; i < userChar.length; i++) {
    console.log(`${userChar[i]}: ${userChar.codePointAt(i).toString(16)}`);
}

const target = "26/01/27⚒️15645";
const check1 = target.includes("🛠");
const check2 = target.includes("⚒");

console.log(`\nIncludes 🛠? ${check1}`);
console.log(`Includes ⚒? ${check2}`);
