
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get directory of this script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const loaderPath = path.join(__dirname, 'esm-loader.mjs');
register(pathToFileURL(loaderPath));

// Import the actual worker script
await import('./optimize-worker.mjs');
