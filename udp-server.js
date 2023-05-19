import dgram from 'dgram';
import logger from './logger.js';

export default function udpServer(port) {
    // create a UDP socket
    const server = dgram.createSocket('udp4');

    // event handler for receiving messages
    server.on('message', (msg, rinfo) => {
        logger.info(`Received message: ${msg.toString('hex')} from ${rinfo.address}:${rinfo.port}`);
        // send a response back to the client
        const bytes = Buffer.from([0x00, 0x00, 0x00, 0x05, 0x75, 0x53, 0x16, 0xc0, 0x00, 0x00, 0x00, 0x00]);
        bytes.writeUInt32BE(Math.floor(Math.random() * 9999), bytes.length - 4);

        server.send(bytes, 0, bytes.length, rinfo.port, rinfo.address, (err) => {
            if (err) {
                logger.error('Error sending response:', err);
            } else {
                logger.info('Response sent successfully!');
            }
        });
    });

    // event handler for errors
    server.on('error', (err) => {
        logger.error('Server error:', err);
        server.close();
    });

    // start the server
    server.bind(port, () => {
        logger.info(`UDP server listening on port ${port}`);
    });
}
