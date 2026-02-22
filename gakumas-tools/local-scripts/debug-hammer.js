
const fs = require('fs');

const testName1 = "25/08/28　🛠️14502"; // Standard emoji
const testName2 = "25/08/28　🛠14502"; // VS16 variant? (Without VS16)

const check = (name) => {
    console.log(`Checking: ${name}`);
    console.log(`Includes 🛠️? ${name.includes("🛠️")}`);
    console.log(`Includes 🛠? ${name.includes("🛠")}`);

    // Hex dump
    console.log("Hex:");
    for (let i = 0; i < name.length; i++) {
        console.log(`${i}: ${name.codePointAt(i).toString(16)}`);
    }
};

check(testName1);
check(testName2);
