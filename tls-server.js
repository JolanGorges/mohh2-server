import tls from 'tls';
import fs from 'fs';
import SocketDataParser from './socket-data-parser.js';

export default function tlsServer(port) {
    const options = {
        key: fs.readFileSync('key.pem'),
        cert: fs.readFileSync('cert.pem'),
        secureProtocol: 'SSLv3_method',
        ciphers: 'RC4-SHA:RC4-MD5'
    };

    // testing with openssl s_client -cipher "RC4-MD5:RC4-SHA" -connect localhost:21171 -ssl3

    const server = tls.createServer(options, (socket) => {
        const parser = new SocketDataParser(socket);
        logger.info('TLS client connected');

        socket.on('error', (error) => {
            if (error.code === 'ECONNRESET') {
                logger.info('TLSclient connection reset');
            } else {
                logger.error('socket error:', error);
            }
        });

        socket.on('data', (data) => {
            parser.parse(data);
        });

        socket.on('end', () => {
            logger.info('TLS client disconnected');
        });
    });

    server.on('tlsClientError', (error, socket) => {
        if (error.code === 'ECONNRESET') {
            logger.info('TLS handshake failed with client');
            logger.info('ensure that the SSL certificate verification is patched in game.dol:');
            logger.info('search for the following bytes in the game.dol file: 40 80 00 08 38 60 10 03 and update the first byte (40) to 41 to patch the file correctly.');
        } else {
            logger.error('TLS client error:', error);
        }
    });

    server.listen(port, () => {
        logger.info(`TLS server listening on port ${port}`);
    });
}