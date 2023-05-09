import net from 'net';
import SocketDataParser from './socket-data-parser.js';

export default function tcpServer(port) {
    const server = net.createServer((socket) => {
        const parser = new SocketDataParser(socket);
        console.log('TCP client connected');

        socket.on('error', (error) => {
            if (error.code === 'ECONNRESET') {
                console.log('TCP client connection reset');
            } else {
                console.error('socket error:', error);
            }
        });

        socket.on('data', (data) => {
            parser.parse(data);
        });

        socket.on('end', () => {
            console.log('TCP client disconnected');
        });
    });

    server.listen(port, () => {
        console.log(`TCP server listening on port ${port}`);
    });
}