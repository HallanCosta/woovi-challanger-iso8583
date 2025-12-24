import { createTcpServer } from '../../lib/tcp/server.ts';
import { processMessageTb } from './issuer.ts';

const TCP_PORT = Number(process.env.SERVER_TCP_PORT || 9202);

export function startIssuerTcpServer(): void {
  const server = createTcpServer(TCP_PORT);

  server.events.on('connect', ({ clientLabel }) =>
    console.log(`[ISSUER] Client connected: ${clientLabel}`)
  );

  server.events.on('message', ({ socket, message, clientLabel }) => {
    processMessageTb({ socket, message, clientLabel });
  });

  server.events.on('disconnect', ({ clientLabel }) =>
    console.log(`[ISSUER] Client disconnected: ${clientLabel}`)
  );

  server.events.on('error', ({ clientLabel, error }) =>
    console.error(`[ISSUER] Socket error from ${clientLabel}: ${error.message}`)
  );

  server.start();
  console.log(`[TCP][ISSUER] Server listening on port ${TCP_PORT}`);
}
