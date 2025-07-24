class Logger {
    constructor() {
        this.isDev = process.argv.includes('--dev');
    }
    
    log(message, ...args) {
        console.log(`[${new Date().toISOString()}] ${message}`, ...args);
    }
    
    debug(message, ...args) {
        if (this.isDev) {
            console.debug(`[${new Date().toISOString()}] DEBUG: ${message}`, ...args);
        }
    }
    
    error(message, error) {
        console.error(`[${new Date().toISOString()}] ERROR: ${message}`, error);
    }
    
    warn(message, ...args) {
        console.warn(`[${new Date().toISOString()}] WARN: ${message}`, ...args);
    }
}

module.exports = new Logger(); 