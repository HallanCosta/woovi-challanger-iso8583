import { once } from 'node:events';
import type { Socket } from 'node:net';

import { parseIsoMessage } from '../../../../lib/iso8583/parser.ts';
import { ISO8583_RESPONSE_CODES } from '../../../../lib/iso8583/responseCodes.ts';
import { DEBUG } from '../../config/env.ts';

const RESPONSE_CODE_APPROVED = '00';

type AwaitResponseOptions = {
  socket: Socket;
  buffer: Buffer;
};

export type SendIso8583MessageResponse = {
  responseCode: string;
  isApproved: boolean;
  description: string;
  mti: string;
  raw: Buffer;
};

type SendIsoMessageOptions = {
  socket: Socket;
  buffer: Buffer;
  label?: string;
};

const awaitResponse = async ({ socket, buffer }: AwaitResponseOptions): Promise<Buffer> => {
  const abortController = new AbortController();
  const { signal } = abortController;

  const dataPromise = (async () => {
    const [data] = await once(socket, 'data', { signal });
    return data as Buffer;
  })();

  const errorPromise = (async () => {
    const [error] = await once(socket, 'error', { signal });
    throw new Error(`Connection error: ${(error as Error).message}`);
  })();

  const timeoutPromise = (async () => {
    await once(socket, 'timeout', { signal });
    socket.destroy();
    throw new Error('Connection timeout');
  })();

  socket.write(buffer);

  try {
    return await Promise.race([dataPromise, errorPromise, timeoutPromise]);
  } finally {
    abortController.abort();
    await Promise.allSettled([dataPromise, errorPromise, timeoutPromise]);
  }
};

export const sendIso8583Message = async ({
  socket,
  buffer,
  label
}: SendIsoMessageOptions): Promise<SendIso8583MessageResponse> => {
  const data = await awaitResponse({ socket, buffer });

  if (DEBUG) {
    const tag = label ? ` [${label}]` : '';
    console.log(`📦 Response received${tag} (${data.length} bytes)`);
    console.log(`Hex: ${data.toString('hex')}\n`);
  }

  const isoPayload = data.subarray(7);
  const parsed = parseIsoMessage(isoPayload);
  const mti = parsed.mti;
  const responseCode: string = parsed.fields.get(39)?.value ?? '';
  const isApproved = responseCode === RESPONSE_CODE_APPROVED;
  const saleResponseCode = ISO8583_RESPONSE_CODES.find((sale) => sale.req === responseCode);
  const description = saleResponseCode?.desc ?? 'Invalid processing code';

  if (DEBUG) {
    const tag = label ? ` [${label}]` : '';
    console.log(`➡️  MTI${tag}: ${mti}`);
  }

  return { responseCode, isApproved, description, mti, raw: data };
};
