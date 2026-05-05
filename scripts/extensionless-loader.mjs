import { stat } from "node:fs/promises";
import { readFile } from "node:fs/promises";
import { fileURLToPath, pathToFileURL } from "node:url";
import path from "node:path";

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "..",
);

async function fileExists(filePath) {
  try {
    const stats = await stat(filePath);
    return stats.isFile();
  } catch {
    return false;
  }
}

async function resolveFilePath(filePath) {
  if (await fileExists(filePath)) return filePath;
  if (await fileExists(`${filePath}.js`)) return `${filePath}.js`;
  if (await fileExists(path.join(filePath, "index.js"))) {
    return path.join(filePath, "index.js");
  }
  return null;
}

async function resolveWorkspacePackage(specifier) {
  for (const packageName of ["gakumas-data", "gakumas-engine"]) {
    if (specifier === packageName || specifier.startsWith(`${packageName}/`)) {
      const subpath =
        specifier === packageName ? "index" : specifier.slice(packageName.length + 1);
      const resolved = await resolveFilePath(
        path.join(repoRoot, "packages", packageName, subpath),
      );
      if (resolved) {
        return { url: pathToFileURL(resolved).href, shortCircuit: true };
      }
    }
  }
  return null;
}

export async function resolve(specifier, context, nextResolve) {
  const workspacePackage = await resolveWorkspacePackage(specifier);
  if (workspacePackage) return workspacePackage;

  try {
    return await nextResolve(specifier, context);
  } catch (error) {
    if (
      error.code !== "ERR_MODULE_NOT_FOUND" &&
      error.code !== "ERR_UNSUPPORTED_DIR_IMPORT"
    ) {
      throw error;
    }

    for (const candidate of [`${specifier}.js`, `${specifier}/index.js`]) {
      try {
        return await nextResolve(candidate, context);
      } catch {}
    }

    throw error;
  }
}

export async function load(url, context, nextLoad) {
  if (url.endsWith(".json")) {
    const source = await readFile(fileURLToPath(url), "utf8");
    return {
      format: "module",
      source: `export default ${source};`,
      shortCircuit: true,
    };
  }

  // The gakumas-tools workspace uses ESM syntax in .js files but its
  // package.json does not declare "type": "module" (Next.js handles that via
  // webpack). Force the imageProcessing files to load as ESM in plain Node
  // so the regression harness can import them directly.
  if (url.includes("/utils/imageProcessing/") && url.endsWith(".js")) {
    const source = await readFile(fileURLToPath(url), "utf8");
    return { format: "module", source, shortCircuit: true };
  }

  return nextLoad(url, context);
}
