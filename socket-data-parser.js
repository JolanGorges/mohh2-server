export default class SocketDataParser {
    constructor(socket) {
        this.socket = socket;
        this.messageBuffer = Buffer.alloc(0);
    }

    parse(data) {
        this.messageBuffer = Buffer.concat([this.messageBuffer, data]);
        while (this.messageBuffer.length >= 12) {
            const messageSize = this.messageBuffer.readUInt32BE(8);
            if (this.messageBuffer.length >= messageSize) {
                const message = this.messageBuffer.subarray(0, messageSize);
                this.messageBuffer = this.messageBuffer.subarray(messageSize);
                this.parseMessage(message);
            }
            else {
                break;
            }
        }
    }

    parseMessage(message) {
        const buffer = Buffer.from(message);
        const id = buffer.toString('utf8', 0, 4);
        const packetSize = buffer.readUInt32LE(8);
        const content = buffer.subarray(12, 12 + packetSize);
        logger.debug(`${id} received: ${content.toString('utf8')}`);
        switch (id) {
            case '@tic':
                break;
            case '@dir':
                this.dirResponse(id);
                break;
            default:
                logger.warn(`${id} not implemented`);
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
        content = Array.from(content).map(([key, value]) => `${key}=${value}`).join('\n') + '\0';
        const buffer = Buffer.alloc(12 + content.length);
        buffer.write(id, 0);
        buffer.writeInt32BE(0, 4);
        buffer.writeInt32BE(content.length + 12, 8);
        buffer.write(content, 12);
        logger.debug(`@dir response: ${content}`);
        this.socket.write(buffer);
    }
}