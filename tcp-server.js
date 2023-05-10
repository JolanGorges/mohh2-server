import net from 'net';
import SocketDataParser from './socket-data-parser.js';

export default function tcpServer(port) {
    const server = net.createServer((socket) => {
        const parser = new SocketDataParser(socket);
        logger.info('TCP client connected');

        socket.on('error', (error) => {
            if (error.code === 'ECONNRESET') {
                logger.info('TCP client connection reset');
            } else {
                logger.error('socket error:', error);
            }
        });

        socket.on('data', (data) => {
            parser.parse(data);
        });

        socket.on('end', () => {
            logger.info('TCP client disconnected');
        });
    });

    server.listen(port, () => {
        logger.info(`TCP server listening on port ${port}`);
    });
}