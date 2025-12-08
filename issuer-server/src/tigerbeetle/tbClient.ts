// Types from tigerbeetle-node are loose; use any to avoid compile friction in this demo.
import { createClient, type CreateAccountsError, type CreateTransfersError } from 'tigerbeetle-node';

export type TbResult<T extends CreateAccountsError | CreateTransfersError> = {
  errors: T[];
};

const TB_CLUSTER_ID = process.env.TB_CLUSTER_ID;
const TB_ADDRESS = process.env.TB_ADDRESS;

if (!TB_CLUSTER_ID || !TB_ADDRESS) {
  throw new Error('Missing TigerBeetle config: ensure TB_CLUSTER_ID and TB_ADDRESS are set (use --env-file .env or export them).');
}

const CLUSTER_ID = BigInt(TB_CLUSTER_ID);

let client: any | null = null;

export const createTbClient = async() => {
  console.log(`[TB] Connecting to ${TB_ADDRESS} (cluster ${CLUSTER_ID.toString()})`);

  client = createClient({
    cluster_id: CLUSTER_ID,
    replica_addresses: [TB_ADDRESS]
  });
}

export const getTbClient = (): any => {
  if (!client) {
    createTbClient();
  }

  return client;
};

export const closeTbClient = async () => {
  if (client && typeof client.close === 'function') {
    await client.close();
    client = null;
  }
};
