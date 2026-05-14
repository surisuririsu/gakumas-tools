
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get directory of this script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const loaderPath = path.resolve(__dirname, '../../../scripts/extensionless-loader.mjs');
register(pathToFileURL(loaderPath));

// Import the actual worker script
await import('./simulate-loadout-worker.mjs');
