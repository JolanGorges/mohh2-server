import logger from './logger.js';
export default class SocketDataParser {
    constructor(socket) {
        this.socket = socket;
        this.messageBuffer = Buffer.alloc(0);
        this.p = 22;
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
        logger.log({
            level: 'debug',
            id: id,
            direction: 'in',
            message: content.toString('utf8')
        });
        switch (id) {
            case '~png':
            case '@tic': // RC4+MD5-V2
            case 'addr': // ADDR=127.0.0.1\nPORT=8388
                break;
            case '@dir': // VERS=WII/MOH08\nSKU=MOHA\nSLUS=RM2X\nSDKVERS=5.6.2.0\nBUILDDATE="Sep  6 2007"
                this.dirResponse(id);
                break;
            case 'sele': // ASYNC=1 STATS=3000 MYGAME=1
                this.seleResponse(id);
                break;
            case 'gpsc': // PARAMS=8,12d,,,-1,,,1e,,-1,1,1,1,1,1,1,1,1,20,,,15f90,122d0022\nUSERPARAMS=AAAAAAAAAAAAAAAAAAAAAQBuDCgAAAAC\nNAME=abcd\nMAXSIZE=33\nCUSTFLAGS=0\nNUMPART=1\nUSERPART=0\nUSERFLAGS=1\nPASS=\nSYSFLAGS=262656\nMINSIZE=1\n\u0000
                this.gpscResponse(id);
                break;
            case 'llvl': // THRESHOLDS=1 and in another packet: CONFIG=1
                this.llvlResponse(id);
                break;
            case 'glea': // FORCE=1\n\u0000
            case 'gdel': // FORCE=1\n\u0000 
            case 'cper': // PERS=fffff\nALTS=4
            case 'llvs': // THRESHOLDS=1 and in another packet: CONFIG=1
            case 'gsea': // AVAIL=-1\nMODE=-1\nMAP=-1\nFF=-1\nTB=-1\nAK=-1\nSMG=-1\nHMG=-1\nRIF=-1\nSNIP=-1\nSHOTG=-1\nBAZ=-1\nGREN=-1\nP=1\nCTRL=-1\nCOUNT=100
                this.dummyResponse(id);
                break;
            case 'pers': // PERS=johndoe\nMAC=$0017ab8f4451
                this.persResponse(id);
                this.sendWho();
                break;
            case 'skey': // SKEY=$5075626c6963204b6579
                this.skeyResponse("skey");
                break;
            case 'news': // NAME=client.cfg
                this.newsResponse(id);
                break;
            case 'auth': // VERS=WII/MOH08\nSKU=MOHA\nSLUS=RM2X\nSDKVERS=5.6.2.0\nBUILDDATE="Sep  6 2007"\nLANG=fr\nMAC=$0017ab8f4451\nTICK=NDS/SVCLOC/TOKEN/83.196.15.56|jHZ0I6Jq8dTbtJXn6qQOEe4d\nGAMECODE=1380790872\nNAME=ffff\nENTL=1\nPASS=~Agky4f|xq>a[zLz0Z%7f%25Rs9[He@ydyV
                this.authResponse(id);
                break;
            default:
                logger.warn(`${id} not implemented`);
                break;
        }
    }


    persResponse(id) {
        const content = new Map([
            ['PERS', 'player'],
            ['LKEY', ''],
            ['EX-ticker', ''],
            ['LOC', 'frFR'],
            ['A', '127.0.0.1'],
            ['LA', '127.0.0.1'],
            ['IDLE', '600000'],
        ]);
        this.send(id, content);
    }

    gpscResponse(id) {
        const content = new Map([
            ['IDENT', '1'],
            ['NAME', 'abcd'],
            ['HOST', 'player'],
            ['GPSHOST', 'player'],
            ['PARAMS', '8,12d,,,-1,,,1e,,-1,1,1,1,1,1,1,1,1,20,,,15f90,122d0022'],
            // ['PLATPARAMS', '0'],  // ???
            ['ROOM', '0'],
            ['CUSTFLAGS', '0'],
            ['SYSFLAGS', '262656'],
            ['COUNT', '1'],
            ['PRIV', '0'],
            ['MINSIZE', '0'],
            ['MAXSIZE', '33'],
            ['NUMPART', '1'],
            ['SEED', '012345'], // random seed
            ['WHEN', '2009.2.8-9:44:15'],
            ['GAMEPORT', '21173'],
            ['VOIPPORT', '21173'],
            // ['GAMEMODE', '0'], // ???
            // ['AUTH', '0'], // ???

            // loop 0x80022058 only if COUNT>=0
            ['OPID0', '0'], // OPID%d
            ['OPPO0', 'player'], // OPPO%d
            ['ADDR0', '127.0.0.1'], // ADDR%d
            ['LADDR0', '127.0.0.1'], // LADDR%d
            ['MADDR0', '$0017ab8f4451'], // MADDR%d
            // ['OPPART0', '0'], // OPPART%d
            // ['OPPARAM0', 'AAAAAAAAAAAAAAAAAAAAAQBuDCgAAAAC'], // OPPARAM%d
            // ['OPFLAGS0', '0'], // OPFLAGS%d
            // ['PRES0', '0'], // PRES%d ???


            // another loop 0x8002225C only if NUMPART>=0
            ['PARTSIZE0', '17'], // PARTSIZE%d
            ['PARTPARAMS0', '0'], // PARTPARAMS%d

            // ['SESS', '0'], %s-%s-%08x 0--498ea96f
        ]);

        // this.send('+who', content2);
        // this.send(id, content);
        this.send('+ses', content);
        this.send('+mgm', content);
        // this.send('+agm', content);

    }

    sendWho() {
        const content = new Map([
            // 0x80022658
            ["I", "71615"],
            ["N", "player"],
            ["F", "U"],
            ["P", "211"],
            ["S", "1,2,3,4,5,6,7,493E0,C350"],
            ["X", "0"],
            ["G", "0"],
            ["AT", ""],
            ["CL", "511"],
            ["LV", "1049601"],
            ["MD", "0"],
            ["R", "0"],
            ["US", "0"],
            ["HW", "0"],
            ["RP", "0"],
            ["LO", "frFR"],
            ["CI", "0"],
            ["CT", "0"],
            // 0x800225E0
            ["A", "127.0.0.1"],
            ["LA", "127.0.0.1"],
            // 0x80021384
            ["C", "4000,,7,1,1,,1,1,5553"],
            ["RI", "0"],
            ["RT", "0"],
            ["RG", "0"],
            ["RGC", "0"],
            // 0x80021468 if RI != ?? then read RM and RF
            ["RM", "0"],
            ["RF", "0"],
        ]);
        this.send('+who', content);
    }

    dummyResponse(id) {
        this.send(id, 'dummy');
    }

    ping() {
        // const content = new Map([
        //     ['REF', '123'],
        // ]);
        this.send('~png', '');
    }


    llvlResponse(id) {
        const content = new Map([
            ['SKILL_PTS', '211'],
            ['SKILL_LVL', '1049601'],
            ['SKILL', ''],
        ]);
        this.send(id, content);
    }

    authResponse(id) {
        const content = new Map([
            ['NAME', 'player'],
            ['ADDR', '127.0.0.1'],
            ['PERSONAS', 'player'],
            ['LOC', 'frFR'],
            ['MAIL', 'player@gmail.com'],
            ['SPAM', 'NN']
        ]);
        this.send(id, content);
    }

    seleResponse(id) {
        const content = new Map([
            ['MORE', '0'],
            ['SLOTS', '4'],
            ['STATS', '0'],
        ]);
        this.send(id, content);
    }

    newsResponse(id) {
        const content = new Map([
            ['BUDDY_SERVER', '127.0.0.1'],
            ['BUDDY_PORT', '21172'],
        ]);
        this.send(id, content);
    }

    skeyResponse(id) {
        const content = new Map([
            ['SKEY', '$51ba8aee64ddfacae5baefa6bf61e009'],
        ]);
        this.send(id, content);
    }

    dirResponse(id) {
        const content = new Map([
            // ['DIRECT', '0'], // 0x8001FC04
            // if DIRECT == 0 then read ADDR and PORT
            ['ADDR', '127.0.0.1'], // 0x8001FC18
            ['PORT', '21172'], // 0x8001fc30
            // ['SESS', '0'], // 0x8001fc48 %s-%s-%08x 0--498ea96f
            // ['MASK', '0'], // 0x8001fc60
            // if ADDR == 0 then read DOWN
            // ['DOWN', '0'], // 0x8001FC90
        ]);
        this.send(id, content);
    }

    send(id, content, id2 = null) {
        if (content instanceof Map)
            content = Array.from(content).map(([key, value]) => `${key}=${value}`).join('\n') + '\0';
        else if (typeof content === 'string')
            content += '\0';
        else
            throw new Error('Invalid content type');
        const buffer = Buffer.alloc(12 + content.length);
        buffer.write(id, 0);
        if (id2)
            buffer.write(id2, 4);
        else
            buffer.writeInt32BE(0, 4);
        buffer.writeInt32BE(content.length + 12, 8);
        buffer.write(content, 12);
        logger.log({
            level: 'debug',
            id: id,
            direction: 'out',
            message: content
        });
        this.socket.write(buffer);
    }
}