import { createTcpServer } from '../../lib/tcp/server.ts';
import { processMessageTb, processMessage } from './issuer.ts';
import { createTbClient } from './tigerbeetle/tbClient.ts';

const PORT = Number(process.env.SERVER_PORT);

async function startIssuerServer(): Promise<void> {
  const server = createTcpServer(PORT);

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
}

createTbClient();
startIssuerServer();
