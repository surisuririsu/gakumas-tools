
import fs from 'fs';
import path from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

/**
 * Resolver hook to handle extension-less imports and directory imports.
 */
export async function resolve(specifier, context, nextResolve) {
    const { parentURL } = context;
    // console.error(`[Loader] resolve: ${specifier} from ${parentURL}`); // DEBUG

    // Proactively check for missing extensions for relative imports
    // This avoids Yarn PnP throwing hard errors for missing files before we can catch them
    if (parentURL && parentURL.startsWith('file://') && (specifier.startsWith('.') || specifier.startsWith('/'))) {
        try {
            const parentPath = fileURLToPath(parentURL);
            const parentDir = path.dirname(parentPath);
            const absolutePath = path.resolve(parentDir, specifier);

            // Check if exact path exists (if not, try extensions)
            // Note: We use try-catch around existsSync just in case
            let existsOriginal = false;
            let isDirectory = false;
            try {
                const stat = fs.statSync(absolutePath);
                existsOriginal = true;
                isDirectory = stat.isDirectory();
            } catch (e) { }

            if (existsOriginal && isDirectory) {
                // ESM does not support directory imports unless package.json exists
                // Check for index.js
                const indexPath = path.join(absolutePath, 'index.js');
                if (fs.existsSync(indexPath)) {
                    // We must return the new specifier
                    return nextResolve(specifier + '/index.js', context);
                }
            }

            if (!existsOriginal) {
                // Try .js
                const jsPath = absolutePath + '.js';
                if (fs.existsSync(jsPath)) {
                    return nextResolve(specifier + '.js', context);
                }

                // Try /index.js
                const indexPath = path.join(absolutePath, 'index.js');
                if (fs.existsSync(indexPath)) {
                    return nextResolve(specifier + '/index.js', context);
                }
            }
        } catch (err) {
            // Ignore errors in path resolution/checking, fall through to default
        }
    }

    // Default delegation
    return nextResolve(specifier, context);
}

/**
 * Load hook to transform JSON files into JS modules conformant with ESM.
 * This bypasses the need for "with { type: 'json' }".
 */
export async function load(url, context, nextLoad) {
    if (url.endsWith('.json')) {
        const filePath = fileURLToPath(url);
        const source = fs.readFileSync(filePath, 'utf8');
        return {
            format: 'module',
            shortCircuit: true,
            source: `export default ${source};`,
        };
    }
    return nextLoad(url, context);
}
