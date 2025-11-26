import { createServer, Socket } from 'node:net';

import { HALLAN_MASTERCARD_CARDS } from './data/cardListBanks.ts';
import formats from '../../lib/iso8583/formats.ts';
import { encodeBitmap, parseIsoMessage, type ParsedIsoMessage, type ParsedIsoField } from '../../lib/iso8583/parser.ts';
import { strToBCD } from '../../lib/iso8583/utils.ts';
import { resolveDelegate } from './logic/delegate.ts';

const DEFAULT_PORT = 9218;
const TPDU_RESPONSE = Buffer.from('6000000001', 'hex');

const responseCodeForCard = (cardNumber?: string): string => {
  if (!cardNumber) return '00';
  return HALLAN_MASTERCARD_CARDS[cardNumber as keyof typeof HALLAN_MASTERCARD_CARDS] ?? '00';
};

const parseIncomingMessage = (message: Buffer): { tpdu: Buffer; iso: ParsedIsoMessage } => {
  const mli = message.readUInt16BE(0);
  const payload = message.subarray(2);

  if (payload.length < mli) {
    throw new Error(`Incomplete ISO8583 payload. Expected ${mli} bytes, got ${payload.length}`);
  }

  const tpdu = payload.subarray(0, 5);
  const isoPayload = payload.subarray(5, mli);

  if (isoPayload.length < 2) {
    throw new Error('Missing MTI');
  }

  return { tpdu, iso: parseIsoMessage(isoPayload) };
};

const formatType = (field: number): string => {
  const fmt = formats[field.toString()];
  const content = fmt?.ContentType?.toUpperCase() ?? '';
  if (content === 'N') return 'N';
  if (content === 'A') return 'A';
  if (content === 'AN') return 'AN';
  if (content === 'ANS') return 'ANS';
  return 'B';
};

type LogRequestInput = {
  message: Buffer;
  parsed: ParsedIsoMessage;
};

const logRequest = ({ message, parsed }: LogRequestInput): void => {
  const hexMessage = message.toString('hex').toUpperCase();
  const headerHex = message.subarray(0, 7).toString('hex').toUpperCase();
  const bitmapHex = parsed.bitmap.toString('hex').toUpperCase();
  const fields = Array.from(parsed.fields.values()).sort((a, b) => a.field - b.field);
  const cardNumber = parsed.fields.get(2)?.value ?? '';
  const expectedCode = responseCodeForCard(cardNumber);

  console.log(`[ISSUER][REQ] Data Received : ${hexMessage}\n`);
  console.log(' -------- REQUEST -------- \n');
  console.log(`[ISSUER][REQ] Header (Len + TPDU):${headerHex}`);
  console.log(`[ISSUER][REQ] ISO Bitmap = ${bitmapHex}`);
  console.log(`[ISSUER][REQ] MTI = ${parsed.mti}`);
  console.log(`[ISSUER][REQ] DE02 (Card Number): ${cardNumber}`);
  // console.log('[ISSUER][REQ] Bits ....');

  for (const field of fields) {
    console.log(
      `[ISSUER][REQ] DE${field.field} | Type ${formatType(field.field)} | Value = ${field.value}`
    );
  }

  console.log(
    `[ISSUER][REQ]Expected Response code (card mapping override or default 00):${expectedCode}`
  );
  // console.log(`[ISSUER][REQ]Card Number:${cardNumber}\n`);
};

type LogResponseInput = {
  fields: ParsedIsoField[];
  rc: string;
  mliDec: number;
  mliHex: string;
  buffer: Buffer;
};

const logResponse = ({ fields, rc, mliDec, mliHex, buffer }: LogResponseInput): void => {
  console.log(' -------- RESPONSE -------- \n');
  console.log('fields:', fields);
  for (const field of fields) {
    const fmt = formats[field.field.toString()];
    const isBinary = fmt?.Format?.toLowerCase() === 'binary' || fmt?.ContentType === 'b';
    const displayValue = isBinary ? field.raw.toString('hex') : field.value;
    console.log(
      `[ISSUER][RES] DE${field.field}: ${displayValue}`
    );
  }

  console.log(`[ISSUER][RES] Msg Length (in Decimal) :${mliDec}`);
  console.log(`[ISSUER][RES] Msg Length (in Hex):${mliHex}`);
  console.log(`[ISSUER][RES] Data Sent: ${buffer.toString('hex').toUpperCase()}`);
  console.log(`[ISSUER][RES] Encoded to: ${buffer.length} bytes`);
};

const encodeField = (fieldNum: number, value: string | undefined): Buffer => {
  const format = formats[fieldNum.toString()];
  const safeValue = value ?? '';

  if (!format) {
    throw new Error(`Unknown format for field ${fieldNum}`);
  }

  const lenType = format.LenType.toLowerCase();
  const fmt = format.Format.toUpperCase();
  const digits = format.MaxLen;

  const encodeFixed = (): Buffer => {
    if (fmt === 'BCD') {
      const padded = safeValue.padStart(digits, '0');
      return strToBCD(padded, Math.ceil(padded.length / 2));
    }

    if (fmt === 'ASCII') {
      return Buffer.from(safeValue.padEnd(digits, ' '), 'ascii');
    }

    return Buffer.from(safeValue || '00', 'hex');
  };

  const encodeVar = (lengthDigits: number): Buffer => {
    const len = safeValue.length;
    const lenPrefix = strToBCD(len.toString().padStart(lengthDigits, '0'), Math.ceil(lengthDigits / 2));
    const treatAsAscii = fmt === 'ASCII' || ['N', 'A', 'AN', 'ANS'].includes(format.ContentType.toUpperCase());
    const dataBuffer = treatAsAscii ? Buffer.from(safeValue, 'ascii') : Buffer.from(safeValue || '00', 'hex');
    return Buffer.concat([lenPrefix, dataBuffer]);
  };

  if (lenType === 'fixed') {
    return encodeFixed();
  }

  if (lenType === 'llvar') {
    return encodeVar(2);
  }

  if (lenType === 'lllvar') {
    return encodeVar(3);
  }

  throw new Error(`Unsupported length type "${format.LenType}" for field ${fieldNum}`);
};

const buildResponseBuffer = (
  parsed: ParsedIsoMessage,
  mti: string,
  rc: string
): { buffer: Buffer; fields: ParsedIsoField[]; mliDec: number; mliHex: string } => {
  const fields = new Map(parsed.fields);
  fields.set(39, {
    field: 39,
    value: rc,
    raw: encodeField(39, rc),
    length: 0,
    startOffset: 0,
    endOffset: 0,
  });

  const sortedFields = Array.from(fields.values()).sort((a, b) => a.field - b.field);
  const encodedBuffers = sortedFields.map((data) => {
    if (data.field === 39) return data.raw!;

    const format = formats[data.field.toString()];

    if (format && (format.LenType === 'llvar' || format.LenType === 'lllvar')) {
      const lenDigits = format.LenType === 'llvar' ? 2 : 3;
      const rawData = data.raw ?? Buffer.alloc(0);
      const lenStr = rawData.length.toString().padStart(lenDigits, '0');
      const lenPrefix = strToBCD(lenStr, Math.ceil(lenDigits / 2));
      return Buffer.concat([lenPrefix, rawData]);
    }

    return data.raw ?? encodeField(data.field, data.value);
  });
  const bitmap = encodeBitmap(sortedFields.map((f) => f.field));

  const responseIso = Buffer.concat([
    strToBCD(mti, 2),
    bitmap,
    ...encodedBuffers,
  ]);

  const mliDec = TPDU_RESPONSE.length + responseIso.length;
  const mliHex = mliDec.toString(16).padStart(4, '0').toUpperCase();
  const mliBuffer = Buffer.alloc(2);
  mliBuffer.writeUInt16BE(mliDec, 0);

  const parsedFields: ParsedIsoField[] = sortedFields.map((f, idx) => ({
    field: f.field,
    value: f.value,
    raw: encodedBuffers[idx],
    length: encodedBuffers[idx].length,
    startOffset: 0,
    endOffset: 0,
  }));

  return {
    buffer: Buffer.concat([mliBuffer, TPDU_RESPONSE, responseIso]),
    fields: parsedFields,
    mliDec,
    mliHex,
  };
};

const processMessage = (socket: Socket, message: Buffer, clientLabel: string): void => {
  const parsedReq = parseIncomingMessage(message);
  const resolution = resolveDelegate({
    mti: parsedReq.iso.mti,
    processingCode: parsedReq.iso.fields.get(3)?.value ?? '',
    cardNumber: parsedReq.iso.fields.get(2)?.value ?? '',
  });
  const response = buildResponseBuffer(parsedReq.iso, resolution.mti, resolution.responseCode);

  logRequest({ message, parsed: parsedReq.iso });
  logResponse({
    fields: response.fields,
    rc: resolution.responseCode,
    mliDec: response.mliDec,
    mliHex: response.mliHex,
    buffer: response.buffer,
  });

  const amount = parsedReq.iso.fields.get(4)?.value ?? 'unknown';
  const processingCode = parsedReq.iso.fields.get(3)?.value ?? '000000';
  const rc = resolution.responseCode;
  const issuerTag = resolution.issuerFound ? '' : ' (issuer not found)';

  console.log(
    `[ISSUER] ${clientLabel} MTI ${parsedReq.iso.mti} ProcCode ${processingCode} Amount ${amount} -> RC ${rc}${issuerTag}`
  );

  socket.write(response.buffer);
};

export function startIssuer(): void {
  const port = Number(process.env.ISSUER_PORT) || DEFAULT_PORT;
  const server = createServer((socket) => {
    const clientLabel = `${socket.remoteAddress ?? 'unknown'}:${socket.remotePort ?? '0'}`;
    console.log(`[ISSUER] Client connected: ${clientLabel}`);

    let buffer = Buffer.alloc(0);

    socket.on('data', (chunk) => {
      buffer = Buffer.concat([buffer, chunk]);

      while (buffer.length >= 2) {
        const expectedLength = buffer.readUInt16BE(0);

        if (!expectedLength) {
          console.warn(`[ISSUER] Invalid MLI from ${clientLabel}`);
          buffer = buffer.subarray(2);
          continue;
        }

        if (buffer.length < expectedLength + 2) {
          break;
        }

        const message = buffer.subarray(0, expectedLength + 2);
        buffer = buffer.subarray(expectedLength + 2);

        try {
          processMessage(socket, message, clientLabel);
        } catch (error: any) {
          console.error(`[ISSUER] Error processing message from ${clientLabel}: ${error.message ?? error}`);
          socket.destroy();
          break;
        }
      }
    });

    socket.on('close', () => {
      console.log(`[ISSUER] Client disconnected: ${clientLabel}`);
    });

    socket.on('error', (err) => {
      console.error(`[ISSUER] Socket error from ${clientLabel}: ${err.message}`);
      socket.destroy();
    });
  });

  server.on('error', (err) => {
    console.error(`[ISSUER] Server error: ${err.message}`);
  });

  server.listen(port, () => {
    console.log(`Issuer listening on port ${port}`);
  });
}
