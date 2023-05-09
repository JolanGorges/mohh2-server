import tlsServer from "./tls-server.js";
import tcpServer from "./tcp-server.js";

const tlsPort = 21171;
const tcpPort = 21172;

tlsServer(tlsPort);
tcpServer(tcpPort);