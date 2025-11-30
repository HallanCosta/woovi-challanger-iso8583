import { Socket } from 'node:net';

import { encodeBitmap, parseIsoMessage, type ParsedIsoMessage, type ParsedIso8583Field } from '../../lib/iso8583/parser.ts';
import { encodeField } from '../../lib/iso8583/encoder.ts';
import { strToBCD } from '../../lib/iso8583/utils.ts';
import ISO8583_FIELD_FORMATS from '../../lib/iso8583/formats.ts';
import { HALLAN_MASTERCARD_CARDS } from '../data/cardListBanksHallan.ts';

import { resolveDelegate } from './logic/delegate.ts';
import { logRequest, logResponse } from './utils/logs.ts';

export type BuildResponseResult = {
  buffer: Buffer;
  fields: ParsedIso8583Field[];
  mliDec: number;
  mliHex: string;
};

export type ProcessMessageInput = {
  socket: Socket;
  message: Buffer;
  clientLabel: string;
};

type ParseIncomingMessage = {
  tpdu: Buffer;
  iso: ParsedIsoMessage;
};

type BuildResponseBuffer = {
  parsed: ParsedIsoMessage;
  mti: string;
  rc: string;
};

const TPDU_RESPONSE = Buffer.from('6000000001', 'hex');

const parseIncomingMessage = (message: Buffer): ParseIncomingMessage => {
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

const buildResponseBuffer = ({ parsed, mti, rc }: BuildResponseBuffer
): BuildResponseResult => {
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

    const format = ISO8583_FIELD_FORMATS[data.field.toString()];

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

  const parsedFields: ParsedIso8583Field[] = sortedFields.map((f, idx) => ({
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

export const processMessage = ({ socket, message, clientLabel }: ProcessMessageInput): void => {
  const parsedReq = parseIncomingMessage(message);
  const cardNumber = parsedReq.iso.fields.get(2)?.value ?? '';

  const resolution = resolveDelegate({
    mti: parsedReq.iso.mti,
    processingCode: parsedReq.iso.fields.get(3)?.value ?? '',
    cardNumber,
  });

  const response = buildResponseBuffer({
    parsed: parsedReq.iso,
    mti: resolution.mti,
    rc: resolution.responseCode,
  });

  logRequest({ message, parsed: parsedReq.iso, cardNumber });
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

  console.log('\n ========== SUMMARY ========== \n');

  console.log(
    `[ISSUER][HALLAN] ${clientLabel} MTI ${parsedReq.iso.mti} ProcCode ${processingCode} Amount ${amount} -> RC ${rc}${issuerTag}`
  );

  socket.write(response.buffer);
};
