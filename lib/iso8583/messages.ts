import { encodeBitmap } from './parser.ts';
import { strToBCD } from './utils.ts';

export type IsoField = {
  field: number;
  value: Buffer;
};

export type BuildIso8583MessageInput = {
  mti: string;          // e.g. '0200'
  fields: IsoField[];   // pre-encoded field buffers
  tpdu?: Buffer;        // default: 6000000001
};

export function buildIso8583Message({
  mti,
  fields,
  tpdu = Buffer.from('6000000001', 'hex'),
}: BuildIso8583MessageInput): Buffer {
  const sortedFields = [...fields].sort((a, b) => a.field - b.field);
  const bitmap = encodeBitmap(sortedFields.map((f) => f.field));
  const mtiBuffer = strToBCD(mti, 2);

  const payload = Buffer.concat([
    tpdu,
    mtiBuffer,
    bitmap,
    ...sortedFields.map((f) => f.value),
  ]);

  const lengthBuffer = Buffer.alloc(2);
  lengthBuffer.writeUInt16BE(payload.length, 0);

  return Buffer.concat([lengthBuffer, payload]);
}
