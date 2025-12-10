import { once } from 'node:events';
import type { Socket } from 'node:net';

import {
  encodeBitmap,
  parseIso8583IncomingMessage,
  type ParsedIso8583Message,
} from '../../../lib/iso8583/parser.ts';
import { getResponseMti } from '../../../lib/iso8583/response.ts';
import { encodeField } from '../../../lib/iso8583/encoder.ts';
import { strToBCD } from '../../../lib/iso8583/utils.ts';
import ISO8583_FIELD_FORMATS from '../../../lib/iso8583/formats.ts';
import { routePan } from '../connectorService.ts';
import { TPDU_RESPONSE } from '../utils/tpdu.ts';

// Build a 0210 response with RC 15 when no issuer/route is found.
const buildRc15Response = (parsed: ParsedIso8583Message): Buffer => {
  const fields = new Map(parsed.fields);
  fields.set(39, {
    field: 39,
    value: '15',
    raw: encodeField(39, '15'),
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

  const mti = getResponseMti({ requestMti: parsed.mti });
  const bitmap = encodeBitmap(sortedFields.map((f) => f.field));
  const responseIso = Buffer.concat([strToBCD(mti, 2), bitmap, ...encodedBuffers]);

  const mliDec = TPDU_RESPONSE.length + responseIso.length;
  const mliBuffer = Buffer.alloc(2);
  mliBuffer.writeUInt16BE(mliDec, 0);

  return Buffer.concat([mliBuffer, TPDU_RESPONSE, responseIso]);
};

export const processMessage = async (client: Socket, message: Buffer, clientLabel: string) => {
  const parsed = parseIso8583IncomingMessage({ message });
  const pan = parsed.iso.fields.get(2)?.value ?? '';
  const processingCode = String(parsed.iso.fields.get(3)?.value);

  // Route to brand (visa, mastercard, pix)
  const connector = await routePan(pan, processingCode);

  if (connector.noop || !connector.socket) {
    const reason = connector.message || 'Issuer not found (BIN)';
    console.log(`[BRANDS] ${reason}`);
    const rc15 = buildRc15Response(parsed.iso);
    client.write(rc15);
    return;
  }

  const issuerSocket = connector.socket;
  issuerSocket.write(message);

  const [response] = await once(issuerSocket, 'data');
  client.write(response as Buffer);
};
