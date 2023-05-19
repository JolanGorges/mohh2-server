import tlsServer from "./tls-server.js";
import tcpServer from "./tcp-server.js";
import udpServer from "./udp-server.js";

const tlsPort = 21171;
const tcpPort = 21172;
const protoAdvtPort = 9999;
const udpPort = 1;

tlsServer(tlsPort);
tcpServer(tcpPort);
udpServer(protoAdvtPort);
udpServer(udpPort);

