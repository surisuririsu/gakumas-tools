
export function parseJsonStream(output: string): any[] {
    const results: any[] = [];
    let depth = 0;
    let start = -1;
    let inString = false;
    let escaped = false;

    for (let i = 0; i < output.length; i++) {
        const char = output[i];

        if (!inString) {
            if (char === '{') {
                if (depth === 0) start = i;
                depth++;
            } else if (char === '}') {
                depth--;
                if (depth === 0 && start !== -1) {
                    const jsonStr = output.substring(start, i + 1);
                    try {
                        results.push(JSON.parse(jsonStr));
                    } catch (e) {
                        // Ignore invalid chunks
                    }
                    start = -1;
                }
            } else if (char === '"') {
                inString = true;
            }
        } else {
            if (escaped) {
                escaped = false;
            } else if (char === '\\') {
                escaped = true;
            } else if (char === '"') {
                inString = false;
            }
        }
    }
    return results;
}
