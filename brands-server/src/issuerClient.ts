import { createTcpClient } from '../../lib/tcp/client.ts';

const ISSUER_SERVER_HOST = String(process.env.ISSUER_SERVER_HOST);
const ISSUER_SERVER_PORT = Number(process.env.ISSUER_SERVER_PORT);

const client = createTcpClient({
  label: 'BRANDS->ISSUER',
  host: ISSUER_SERVER_HOST,
  port: ISSUER_SERVER_PORT
});

export const getIssuerConnection = client.getConnection;
export const closeIssuerConnection = client.closeConnection;
