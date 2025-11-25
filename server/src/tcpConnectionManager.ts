import { once } from 'node:events';
import { connect, Socket } from 'node:net';

const CONNECTION_TIMEOUT_MS = 10000;
const RECONNECT_DELAY_MS = 1000;

type ConnectionManager = {
  getConnection: () => Promise<Socket>;
  closeConnection: () => Promise<void>;
};

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

const createConnectionManager = (label: string, host: string, port: number): ConnectionManager => {
  let socket: Socket | null = null;
  let connectInProgress: Promise<Socket> | null = null;
  let retryConnection = true;

  const establishConnection = async (): Promise<Socket> => {
    while (true) {
      const s = connect({ host, port });
      s.setTimeout(CONNECTION_TIMEOUT_MS);

      try {
        await Promise.race([
          once(s, 'connect'),
          once(s, 'error').then(([err]) => {
            throw new Error(`TCP connection error: ${err.message}`);
          }),
        ]);

        console.log(`[TCP][${label}] Connected to issuer at ${host}:${port}`);

        socket = s;

        s.on('close', () => {
          socket = null;
          connectInProgress = null;

          if (!retryConnection) {
            console.warn(`[TCP][${label}] Issuer connection closed.`);
            retryConnection = true;
            return;
          }

          console.warn(`[TCP][${label}] Issuer connection lost. Reconnecting...`);
          connectInProgress = establishConnection();
        });

        s.on('error', (err) => {
          console.warn(`[TCP][${label}] Socket error: ${err.message}`);
        });

        return s;
      } catch (err) {
        s.destroy();
        console.warn(
          `[TCP][${label}] Failed to connect to issuer. Retrying in ${RECONNECT_DELAY_MS}ms`
        );
        await sleep(RECONNECT_DELAY_MS);
      }
    }
  };

  const getConnection = async (): Promise<Socket> => {
    if (socket && !socket.destroyed) {
      return socket;
    }

    if (!connectInProgress) {
      connectInProgress = establishConnection();
    }

    return connectInProgress;
  };

  const closeConnection = async (): Promise<void> => {
    retryConnection = false;

    if (socket && !socket.destroyed) {
      socket.destroy();
    }

    socket = null;
    connectInProgress = null;
  };

  return { getConnection, closeConnection };
};

const HALLAN_PORT = Number(process.env.ISSUER_PORT) || 9218;
const HALLAN_HOST = process.env.HOST || 'localhost';

const hallanManager = createConnectionManager('HALLAN', HALLAN_HOST, HALLAN_PORT);

export const establishConnectionIssuer = hallanManager.getConnection;
export const getIssuerConnection = hallanManager.getConnection;
export const closeIssuerConnection = hallanManager.closeConnection;
