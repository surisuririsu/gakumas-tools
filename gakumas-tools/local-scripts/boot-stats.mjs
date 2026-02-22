
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get directory of this script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const loaderPath = path.join(__dirname, 'esm-loader.mjs');
const loaderUrl = pathToFileURL(loaderPath);

// Register our custom loader
register(loaderUrl);

// Check if arguments are provided (e.g., idol name)
// argv[0] is node, argv[1] is script path
const args = process.argv.slice(2);

if (args.length > 0) {
    // If arguments exist, run the detailed analysis
    await import('./analyze-memories.mjs');
} else {
    // Otherwise run the summary stats
    await import('./memory-stats.mjs');
}
