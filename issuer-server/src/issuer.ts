import { Socket } from 'node:net';

import { parseIso8583IncomingMessage } from '../../lib/iso8583/parser.ts';
import { getResponseMti } from '../../lib/iso8583/response.ts';
import { buildIso8583Response } from '../../lib/iso8583/response.ts';
import { ISO8583_RESPONSE_CODES_NAMES } from '../../lib/iso8583/responseCodes.ts';
import { MTI } from '../../lib/iso8583/mti.ts';

import { logMessage } from './utils/logs.ts';
import { TPDU_RESPONSE } from './utils/tpdu.ts';

import { authorizeCard } from './modules/card/queries/authorizeCard.ts';
import { createCardTransaction } from './modules/card/commands/createCardTransaction.ts';
import { findCard } from './modules/card/queries/findCard.ts';

export type IssuerMessageInput = {
  socket: Socket;
  message: Buffer;
  clientLabel: string;
};

// Process message to authorization and transaction
export async function processMessageTb({ socket, message, clientLabel }: IssuerMessageInput): Promise<void> {
  const parsed = parseIso8583IncomingMessage({ message });
  const mti = parsed.iso.mti;

  console.log(`[ISSUER] ${clientLabel} MTI ${mti}`);

  if (mti === MTI.AUTHORIZATION_REQUEST) {
    const res = await authorizeCard({ iso: parsed.iso });
    socket.write(res.buffer);
    return;
  }

  if (mti === MTI.SALE_REQUEST) {
    const res = await createCardTransaction({ iso: parsed.iso });
    socket.write(res.buffer);
    return;
  }

  console.log(`[ISSUER] Unknown MTI ${mti}, echo back.`);
  socket.write(message);
}

// Alternative entry point mirroring processMessageTb to simulation.
// export const processMessage = ({ socket, message, clientLabel }: IssuerMessageInput) => {
//   const parsedMessage = parseIso8583IncomingMessage({ message });
//   const cardNumber = parsedMessage.iso.fields.get(2)?.value ?? '';
//   const mti = parsedMessage.iso.mti;
//
//   if (!findCard(cardNumber)) {
//     const response = buildIso8583Response({
//       parsed: parsedMessage.iso,
//       mti: getResponseMti({ requestMti: mti }),
//       rc: ISO8583_RESPONSE_CODES_NAMES.INVALID_CARD,
//       tpdu: TPDU_RESPONSE
//     });
//
//     // Log the response message
//     logMessage({
//       message,
//       parsed: parsedMessage.iso,
//       fields: response.fields,
//       rc: ISO8583_RESPONSE_CODES_NAMES.INVALID_CARD,
//       mliDec: response.mliDec,
//       mliHex: response.mliHex,
//       buffer: response.buffer,
//     });
//
//     socket.write(response.buffer);
//     return;
//   }
//
//   const response = buildIso8583Response({
//     parsed: parsedMessage.iso,
//     mti: getResponseMti({ requestMti: mti }),
//     rc: ISO8583_RESPONSE_CODES_NAMES.APPROVED,
//     tpdu: TPDU_RESPONSE
//   });
//
//   // Log the response message
//   logMessage({
//     message,
//     parsed: parsedMessage.iso,
//     fields: response.fields,
//     rc: ISO8583_RESPONSE_CODES_NAMES.APPROVED,
//     mliDec: response.mliDec,
//     mliHex: response.mliHex,
//     buffer: response.buffer,
//   });
//
//   socket.write(response.buffer);
// };
