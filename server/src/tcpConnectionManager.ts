import { once } from "node:events";
import { connect, Socket } from "node:net";

const PORT = Number(process.env.ISSUER_PORT) || 9218;
const HOST = process.env.HOST || "localhost";
const CONNECTION_TIMEOUT_MS = 10000;
const RECONNECT_DELAY_MS = 1000;

let socket: Socket | null = null;
let connectInProgress: Promise<Socket> | null = null;
let retryConnection: boolean = true

const sleep = (ms: number) => new Promise(res => setTimeout(res, ms));

export const establishConnectionIssuer = async (): Promise<Socket> => {
  while (true) {
    const s = connect({ host: HOST, port: PORT });
    s.setTimeout(CONNECTION_TIMEOUT_MS);

    try {
      await Promise.race([
        once(s, "connect"),
        once(s, "error").then(([err]) => {
          throw new Error(`TCP connection error: ${err.message}`);
        }),
      ]);

      console.log(`[TCP] Connected to issuer at ${HOST}:${PORT}`);

      socket = s;

      s.on("close", () => {
        socket = null;
        connectInProgress = null

        if (!retryConnection) {
          console.warn("[TCP] Issuer connection lost.");
          retryConnection = true
          return;
        }

        console.warn("[TCP] Issuer connection lost. Reconnecting...");
        connectInProgress = establishConnectionIssuer();
      });

      s.on("error", (err) => {
        console.warn(`[TCP] Socket error: ${err.message}`);
      });

      return s;

    } catch (err) {
      s.destroy();
      console.warn(
        `[TCP] Failed to connect to issuer. Retrying in ${RECONNECT_DELAY_MS}ms`
      );
      await sleep(RECONNECT_DELAY_MS);
    }
  }
}

export const getIssuerConnection = async (): Promise<Socket> => {
  if (socket && !socket.destroyed) {
    return socket;
  }

  if (!connectInProgress) {
    connectInProgress = establishConnectionIssuer();
  }

  return connectInProgress;
}

export const closeIssuerConnection = async (): Promise<void> => {
  if (socket && !socket.destroyed) {
    socket.destroy();
  }
  
  socket = null;
  connectInProgress = null;
  retryConnection = false
}
