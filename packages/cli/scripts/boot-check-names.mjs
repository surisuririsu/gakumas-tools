
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

// Import the script
await import('./check-names.mjs');
