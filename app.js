import tlsServer from "./tls-server.js";
import tcpServer from "./tcp-server.js";

import winston from "winston";

global.logger = winston.createLogger({
    format: winston.format.combine(
        winston.format.colorize(),
        winston.format.cli()),
    level: 'info',
    transports: [
        //
        // - Write all logs with importance level of `error` or less to `error.log`
        // - Write all logs with importance level of `info` or less to `combined.log`
        //
        new winston.transports.File({ filename: 'error.log', level: 'error', options: { flags: 'w' } }),
        new winston.transports.File({ filename: 'combined.log', options: { flags: 'w' } }),
        new winston.transports.Console({ format: winston.format.cli(), level: 'debug' }),
    ],
});

const tlsPort = 21171;
const tcpPort = 21172;

tlsServer(tlsPort);
tcpServer(tcpPort);