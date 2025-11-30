import ISO8583_FIELD_FORMATS from './formats.ts';
import { strToBCD } from './utils.ts';

export const encodeField = (fieldNum: number, value: string | undefined): Buffer => {
  const format = ISO8583_FIELD_FORMATS[fieldNum.toString()];
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

export const fieldEncoder = {
  encodeField,
};
