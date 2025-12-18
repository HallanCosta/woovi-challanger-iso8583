import { createTcpServer } from '../../lib/tcp/server.ts';
import { processMessage } from './modules/brand/messageHandler.ts';

const DEFAULT_BRAND_PORT = Number(process.env.SERVER_PORT);

function startBrandServer(): void {
  const port = DEFAULT_BRAND_PORT;
  const server = createTcpServer(port);

  server.events.on('connect', ({ clientLabel }) =>
    console.log(`[BRANDS] Client connected: ${clientLabel}`)
  );

  server.events.on('message', ({ socket, message, clientLabel }) => {
    processMessage(socket, message, clientLabel).catch((err) => {
      console.error(`[BRANDS] Error processing message from ${clientLabel}: ${err.message}`);
      socket.destroy();
    });
  });

  server.events.on('disconnect', ({ clientLabel }) =>
    console.log(`[BRANDS] Client disconnected: ${clientLabel}`)
  );

  server.events.on('error', ({ clientLabel, error }) =>
    console.error(`[BRANDS] Socket error from ${clientLabel}: ${error.message}`)
  );

  server.start();
}

startBrandServer();
