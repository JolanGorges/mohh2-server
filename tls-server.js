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
        console.log('TLS client connected');

        socket.on('error', (error) => {
            if (error.code === 'ECONNRESET') {
                console.log('TLSclient connection reset');
            } else {
                console.error('socket error:', error);
            }
        });

        socket.on('data', (data) => {
            parser.parse(data);
        });

        socket.on('end', () => {
            console.log('TLS client disconnected');
        });
    });

    server.on('tlsClientError', (error, socket) => {
        if (error.code === 'ECONNRESET') {
            console.log('TLS handshake failed with client');
            console.log('ensure that the SSL certificate verification is patched in game.dol:');
            console.log('search for the following bytes in the game.dol file: 40 80 00 08 38 60 10 03 and update the first byte (40) to 41 to patch the file correctly.');
        } else {
            console.error('TLS client error:', error);
        }
    });

    server.listen(port, () => {
        console.log(`TLS server listening on port ${port}`);
    });
}