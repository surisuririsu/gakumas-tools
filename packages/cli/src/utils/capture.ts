
export class GlobalCapture {
    private static capturing = false;
    private static capturedData = '';
    private static originalWrite: any;

    static enable() {
        if (this.capturing) return;

        this.capturing = true;
        this.originalWrite = process.stdout.write.bind(process.stdout);

        process.stdout.write = (chunk: any, encoding?: any, callback?: any) => {
            // Buffer the data
            if (typeof chunk === 'string') {
                this.capturedData += chunk;
            } else if (Buffer.isBuffer(chunk)) {
                this.capturedData += chunk.toString('utf8');
            }

            // Pass through to original stdout
            return this.originalWrite(chunk, encoding, callback);
        };
    }

    static isCapturing() {
        return this.capturing;
    }

    static getCapturedOutput() {
        return this.capturedData;
    }
}
