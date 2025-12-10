import { encodeBitmap, type ParsedIso8583Message, type ParsedIso8583Field } from './parser.ts';
import { encodeField } from './encoder.ts';
import ISO8583_FIELD_FORMATS from './formats.ts';
import { strToBCD } from './utils.ts';

type ResponseMtiParams = {
  requestMti: string;
  fallback?: string;
};

export type BuildIso8583ResponseResult = {
  buffer: Buffer;
  fields: ParsedIso8583Field[];
  mliDec: number;
  mliHex: string;
};

export type BuildIso8583ResponseInput = {
  parsed: ParsedIso8583Message;
  mti: string;
  rc: string;
  tpdu: Buffer;
};

export const buildIso8583Response = ({
  parsed,
  mti,
  rc,
  tpdu,
}: BuildIso8583ResponseInput): BuildIso8583ResponseResult => {
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
  const responseIso = Buffer.concat([strToBCD(mti, 2), bitmap, ...encodedBuffers]);

  const mliDec = tpdu.length + responseIso.length;
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
    buffer: Buffer.concat([mliBuffer, tpdu, responseIso]),
    fields: parsedFields,
    mliDec,
    mliHex,
  };
};

export function getResponseMti({ requestMti, fallback }: ResponseMtiParams): string {
  if (requestMti === '0100') return '0110';
  if (requestMti === '0200') return '0210';
  if (requestMti === '0400') return '0410';
  if (requestMti === '0800') return '0810';

  return fallback ?? requestMti;
}
