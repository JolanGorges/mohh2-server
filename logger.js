import { createLogger, format, transports } from "winston";
const { combine, timestamp, printf, colorize, json } = format;

const myFormat = printf(({ level, id, direction, message, timestamp }) => {
    if (direction) {
        return `${timestamp} ${level} \x1b[36m${id}\x1b[0m \x1b[35m${direction}\x1b[0m ${message}`;
    }
    return `${timestamp} ${level}: ${message}`;
});

export default createLogger({
    level: 'debug',
    transports: [
        new transports.File({
            filename: 'error.log',
            level: 'error',
            options: { flags: 'w' },
            format: combine(timestamp({ format: 'HH:mm:ss' }), json())
        }),
        new transports.File({
            filename: 'combined.log',
            options: { flags: 'w' },
            format: combine(timestamp({ format: 'HH:mm:ss' }), json())
        }),
        new transports.Console({
            format: combine(colorize(), timestamp({ format: 'HH:mm:ss' }), myFormat)
        })
    ]
});
