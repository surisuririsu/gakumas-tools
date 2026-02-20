import { spawn } from 'child_process';
import path from 'path';
import { GlobalCapture } from './capture';

export const GAKUMAS_TOOLS_ROOT = path.resolve(process.cwd(), '../../gakumas-tools');
export const LOCAL_SCRIPTS_DIR = path.resolve(__dirname, '../../scripts');

export interface RunScriptOptions {
    cwd?: string;
    captureOutput?: boolean;
}

export async function runScript(scriptName: string, args: string[], options: RunScriptOptions | string = {}) {
    const cwd = typeof options === 'string' ? options : (options.cwd || GAKUMAS_TOOLS_ROOT);
    const captureOutput = typeof options === 'string' ? false : (options.captureOutput || false);

    const scriptPath = path.join(LOCAL_SCRIPTS_DIR, scriptName);

    // Only log if not capturing output to avoid polluting stdout if we want to pipe it later
    if (!captureOutput) {
        console.error(`Executing: yarn node ${scriptPath} ${args.join(' ')}`);
    }

    const isCapturing = GlobalCapture.isCapturing();
    const stdioMode = captureOutput ? ['inherit', 'pipe', 'inherit'] :
        (isCapturing ? ['inherit', 'pipe', 'inherit'] : 'inherit');

    const child = spawn('yarn', ['node', scriptPath, ...args], {
        cwd,
        stdio: stdioMode as any, // Cast to any to satisfy TS for simple array
        env: { ...process.env }
    });

    let output = '';

    if ((captureOutput || isCapturing) && child.stdout) {
        child.stdout.on('data', (data) => {
            if (captureOutput) {
                output += data.toString();
            }
            // Only pipe to stdout if we are NOT capturing internally (i.e. captureOutput is false)
            // If captureOutput is true, the caller is responsible for what to do with the output.
            if (isCapturing && !captureOutput) {
                // Pipe to process.stdout so GlobalCapture hooks can see it (and user sees it)
                process.stdout.write(data);
            }
        });
    }

    return new Promise<string | void>((resolve, reject) => {
        child.on('close', (code) => {
            if (code === 0) {
                resolve(captureOutput ? output : undefined);
            } else {
                reject(new Error(`Script exited with code ${code}`));
            }
        });

        child.on('error', (err) => {
            reject(err);
        });
    });
}
