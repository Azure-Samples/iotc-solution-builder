import log from 'electron-log';

// turn off file logging (keep second default of console logging on)
log.transports.file.level = false;
log.transports.console.level = 'info';

class Logger {
    // TBD: desired usage and output...
    // logger([ModuleName, 'error'], `Error while creating streaming locator: ${ex.message}`);
    // [2022-02-16T12:57:38-0800] INFO: [startup,info] ✅ Server started
    public log(tags: string[], ...params: any[]): void {
        const checkTags = Array.isArray(tags) ? tags : [];
        const message = `[${checkTags.join(', ')}] ${(params || []).join(' ')}`;

        if (checkTags.includes('debug')) {
            log.debug(message);
        }
        else if (checkTags.includes('error')) {
            log.error(message);
        }
        else if (checkTags.includes('warn')) {
            log.warn(message);
        }
        else {
            log.info(message);
        }
    }
}

const logger = new Logger();

export default logger;
