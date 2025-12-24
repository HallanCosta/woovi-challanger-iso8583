import { createTbClient } from './modules/tigerbeetle/tbClient.ts';
import { startIssuerHttpServer } from './issuerHttpServer.ts';
import { startIssuerTcpServer } from './issuerTcpServer.ts';

async function main(): Promise<void> {
  await createTbClient();
  startIssuerTcpServer();
  startIssuerHttpServer();
}

main()
