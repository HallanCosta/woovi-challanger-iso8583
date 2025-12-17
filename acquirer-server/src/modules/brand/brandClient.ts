import { createTcpClient } from '../../../../lib/tcp/client.ts';

const BRANDS_SERVER_HOST = String(process.env.BRANDS_SERVER_HOST);
const BRANDS_SERVER_PORT = Number(process.env.BRANDS_SERVER_PORT);

const brandClient = createTcpClient({
  label: 'ACQUIRER->BRANDS',
  host: BRANDS_SERVER_HOST,
  port: BRANDS_SERVER_PORT
});

export const establishConnectionBrand = brandClient.getConnection;
export const getBrandConnection = brandClient.getConnection;
export const closeBrandConnection = brandClient.closeConnection;
