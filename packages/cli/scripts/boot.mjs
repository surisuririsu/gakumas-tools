
import { register } from 'node:module';
import { pathToFileURL } from 'node:url';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Get directory of this script
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const loaderPath = path.join(__dirname, 'esm-loader.mjs');
const loaderUrl = pathToFileURL(loaderPath);

// Register our custom loader
// Registered LAST = Executed FIRST.
// PnP loader is loaded via CLI (--import .pnp.loader.mjs), so it is registered "earlier".
// Thus, this loader will wrap PnP.
register(loaderUrl);

// Import the main script
// We use dynamic import so that the loader applies to its imports
await import('./optimize-memories-parallel.mjs');
