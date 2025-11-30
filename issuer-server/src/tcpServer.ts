import { createServer, Socket } from "node:net";
import { EventEmitter } from "node:events";

import { handleTcpConnection } from "./tcpConnection.ts";

export type TcpServerEvents = EventEmitter & {
  on(event: "message", listener: (data: { socket: Socket; message: Buffer; clientLabel: string }) => void): EventEmitter;
  on(event: "connect", listener: (data: { clientLabel: string }) => void): EventEmitter;
  on(event: "disconnect", listener: (data: { clientLabel: string }) => void): EventEmitter;
  on(event: "error", listener: (data: { clientLabel: string; error: Error }) => void): EventEmitter;
};

export type TcpServer = {
  start: () => void;
  stop: () => void;
  events: TcpServerEvents;
};

export function createTcpServer(port: number): TcpServer {
  const events: TcpServerEvents = new EventEmitter() as TcpServerEvents;

  const server = createServer((socket) => handleTcpConnection(socket, events));

  server.on("error", (err) => {
    events.emit("error", { clientLabel: "server", error: err });
  });

  const start = () => {
    server.listen(port, () => {
      console.log(`[TCP][ISSUER][HALLAN] Listening on port ${port}`);
    });
  };

  const stop = () => {
    server.close();
  };

  return { start, stop, events };
}
