#!/bin/bash

set -e

# Prompt for changelog entry
echo "📝 Enter changelog entry:"
read changelog_entry

# Get today's date
today=$(date +"%Y-%m-%d")

# Update lastUpdated in simulator source (assumes format: lastUpdated: "YYYY-MM-DD")
echo "🔧 Updating lastUpdated in Simulator..."
sed -i '' -E "s/(\{t\(\"lastUpdated\"\)\}: )([0-9]{4}-[0-9]{2}-[0-9]{2})/\1$today/" gakumas-tools/components/Simulator/Simulator.js

# Add changelog entry
echo "📦 Appending to CHANGELOG.md..."
echo "- $today: $changelog_entry" >> gakumas-tools/simulator/CHANGELOG.md

echo "✅ Metadata updated."

# Optional commit
echo "🔒 Do you want to commit these changes? (y/n)"
read confirm
if [[ "$confirm" == "y" ]]; then
  git add gakumas-tools/components/Simulator/Simulator.js
  git add gakumas-tools/simulator/CHANGELOG.md
  git commit -m "$changelog_entry"
  echo "🚀 Changes committed."
else
  echo "🕒 Changes staged but not committed."
fi
