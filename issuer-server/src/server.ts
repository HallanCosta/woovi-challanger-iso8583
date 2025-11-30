import { processMessage } from './issuer.ts';
import { createTcpServer } from './tcpServer.ts';

const port = Number(process.env.ISSUER_PORT);

const server = createTcpServer(port);

server.events.on("connect", ({ clientLabel }) => {
  console.log("Client connected:", clientLabel);
});

server.events.on("message", ({ socket, message, clientLabel }) => {
  processMessage({ socket, message, clientLabel });
});

server.events.on("disconnect", ({ clientLabel }) => {
  console.log("Client disconnected:", clientLabel);
});

server.events.on("error", ({ clientLabel, error }) => {
  console.error("TCP Error:", clientLabel, error);
});

server.start();
