import { bcdToStr } from './utils.ts';
import type { ISO8583FieldFormat } from './formats.ts';

const ASCII_FIXED = new Set(['n', 'a', 'an']);
const ASCII_VARIABLE = new Set(['n', 'a', 'an', 'ans']);

const readLengthFromBcd = (buffer: Buffer, offset: number, digits: number) => {
  const lenBytes = Math.ceil(digits / 2);
  const length = parseInt(bcdToStr(buffer.subarray(offset, offset + lenBytes), digits), 10);
  return { length, lengthBytes: lenBytes };
};

const readAscii = (buffer: Buffer, offset: number, size: number) => {
  const raw = buffer.subarray(offset, offset + size);
  return { value: raw.toString('ascii'), raw, newOffset: offset + size };
};

const readHex = (buffer: Buffer, offset: number, size: number) => {
  const raw = buffer.subarray(offset, offset + size);
  return { value: raw.toString('hex'), raw, newOffset: offset + size };
};

const readBcd = (buffer: Buffer, offset: number, digits: number) => {
  const bytes = Math.ceil(digits / 2);
  const raw = buffer.subarray(offset, offset + bytes);
  return { value: bcdToStr(raw, digits), raw, newOffset: offset + bytes };
};

const parseFixedField = (buffer: Buffer, offset: number, format: ISO8583FieldFormat) => {
  const { ContentType: contentType, Format: fieldFormat, MaxLen: size } = format;

  if (contentType === 'n' && fieldFormat === 'BCD') {
    return readBcd(buffer, offset, size);
  }

  if (ASCII_FIXED.has(contentType)) {
    return readAscii(buffer, offset, size);
  }

  return readHex(buffer, offset, size);
};

const parseVariableField = (
  buffer: Buffer,
  offset: number,
  format: ISO8583FieldFormat,
  lengthDigits: number
) => {
  const { ContentType: contentType } = format;
  const { length, lengthBytes } = readLengthFromBcd(buffer, offset, lengthDigits);
  const newOffset = offset + lengthBytes;
  const treatAsAscii = ASCII_VARIABLE.has(contentType) && format.Format !== 'BCD';

  return treatAsAscii
    ? readAscii(buffer, newOffset, length)
    : readHex(buffer, newOffset, length);
};

export function parseField(
  buffer: Buffer,
  offset: number,
  format: ISO8583FieldFormat
): { value: string; raw: Buffer; newOffset: number } {
  switch (format.LenType) {
    case 'fixed':
      return parseFixedField(buffer, offset, format);
    case 'llvar':
      return parseVariableField(buffer, offset, format, 2);
    case 'lllvar':
      return parseVariableField(buffer, offset, format, 3);
    default:
      throw new Error(`Unsupported length type "${format.LenType}"`);
  }
}

export const fieldParsers = {
  parseField,
  readLengthFromBcd,
  readAscii,
  readHex,
  readBcd,
  parseFixedField,
  parseVariableField,
};
