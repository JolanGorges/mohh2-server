export default class SocketDataParser {
    constructor(socket) {
        this.socket = socket;
    }

    parse(data) {
        const buffer = Buffer.from(data);
        const id = buffer.toString('utf8', 0, 4);
        const packetSize = buffer.readUInt32LE(8);
        const content = buffer.subarray(12, 12 + packetSize);
        switch (id) {
            case '@tic':
                console.log(`@tic: ${content.toString('utf8')}`);
                break;
            case '@dir':
                this.dirResponse(id);
                break;
            default:
                console.log(`${id}: ${content.toString('utf8')}`);
                break;
        }

    }

    dirResponse(id) {
        const content = new Map([
            ['ADDR', '127.0.0.1'],
            ['PORT', '21172']
        ]);
        this.send(id, content);
    }

    send(id, content) {
        content = Array.from(content).map(([key, value]) => `${key}=${value}`).join('\n');
        const buffer = Buffer.alloc(12 + content.length);
        buffer.write(id, 0);
        buffer.writeInt32BE(0, 4);
        buffer.writeInt32BE(content.length + 12, 8);
        buffer.write(content, 12);
        this.socket.write(buffer);
    }
}