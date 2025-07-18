const fs = require("fs");
const path = require("path");
const readline = require("readline");

// File path to JSX component
const filePath = path.join(
  __dirname,
  "../gakumas-tools/components/Simulator/Simulator.js"
);

// Changelog path
const changelogPath = path.join(
  __dirname,
  "../gakumas-tools/simulator/CHANGELOG.md"
);

// Prompt for changelog entry
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("📝 Enter changelog entry: ", (entry) => {
  const today = new Date().toISOString().slice(0, 10);

  // Update the JSX file
  let content = fs.readFileSync(filePath, "utf8");
  const updatedContent = content.replace(
    /\{t\("lastUpdated"\)\}: [0-9]{4}-[0-9]{2}-[0-9]{2}/,
    `{t("lastUpdated")}: ${today}`
  );
  fs.writeFileSync(filePath, updatedContent, "utf8");
  console.log("✅ Updated lastUpdated in JSX.");

  // Insert into CHANGELOG.md in the correct spot
  let changelog = fs.readFileSync(changelogPath, "utf8");
  const lines = changelog.split("\n");
  const dateHeader = `## ${today}`;
  let dateIndex = lines.findIndex((line) => line.trim() === dateHeader);

  if (dateIndex === -1) {
    // Insert new date section after the first header (after intro)
    let insertAt = lines.findIndex((line) => line.startsWith("## "));
    if (insertAt === -1) insertAt = lines.length;
    const newSection = ["", dateHeader, "", `- ${entry}`, ""];
    lines.splice(insertAt, 0, ...newSection);
  } else {
    // Insert after the date header and any blank lines
    let insertAt = dateIndex + 1;
    while (insertAt < lines.length && lines[insertAt].trim() === "") insertAt++;
    // Find if there are already entries for this date
    // Insert after the last "- ..." line under this date, but before next date header
    let lastEntryIndex = insertAt - 1;
    for (let i = insertAt; i < lines.length; i++) {
      if (lines[i].startsWith("## ")) break;
      if (lines[i].startsWith("- ")) lastEntryIndex = i;
    }
    if (lastEntryIndex >= insertAt - 1) {
      lines.splice(lastEntryIndex + 1, 0, `- ${entry}`);
    } else {
      lines.splice(insertAt, 0, `- ${entry}`);
    }
  }

  fs.writeFileSync(changelogPath, lines.join("\n"), "utf8");
  console.log("📦 Updated CHANGELOG.md.");

  rl.question("🔒 Do you want to commit these changes? (y/n): ", (confirm) => {
    if (confirm.toLowerCase() === "y") {
      const { exec } = require("child_process");
      exec(
        `git add --all && git commit -m "${entry}"`,
        (error, stdout, stderr) => {
          if (error) {
            console.error(`❌ Commit failed: ${error.message}`);
          } else {
            console.log("🚀 Changes committed.");
          }
          rl.close();
        }
      );
    } else {
      console.log("🕒 Changes staged but not committed.");
      rl.close();
    }
  });
});
