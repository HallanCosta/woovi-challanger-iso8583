import { bcdToStr } from './utils.ts';
import ISO8583_FIELD_FORMATS from './formats.ts';
import { parseField } from './parserHelpers.ts';

export type ParsedIso8583Field = {
  field: number;
  value: string;
  raw: Buffer;
  length: number;
  startOffset: number;
  endOffset: number;
};

export type ParsedIsoMessage = {
  mti: string;
  bitmap: Buffer;
  bits: number[];
  fields: Map<number, ParsedIso8583Field>;
  lastOffset: number;
};

// ---------------------------------------------------------------------------
// Bitmap helpers
// ---------------------------------------------------------------------------

export function decodeBitmap(buffer: Buffer): { bits: number[]; bitmapLength: number } {
  const hasExtendedBitmap = (buffer[0] & 0x80) !== 0;
  const bitmapLength = hasExtendedBitmap ? 16 : 8;
  const bits: number[] = [];

  for (let byteIndex = 0; byteIndex < bitmapLength; byteIndex++) {
    const byte = buffer[byteIndex];

    for (let bitIndex = 7; bitIndex >= 0; bitIndex--) {
      const bitNumber = byteIndex * 8 + (7 - bitIndex) + 1;
      if (bitNumber === 1) continue; // Bit 1 indica bitmap estendido

      if (byte & (1 << bitIndex)) {
        bits.push(bitNumber);
      }
    }
  }

  return { bits, bitmapLength };
}

export function encodeBitmap(fields: number[]): Buffer {
  const maxField = Math.max(...fields);
  const bitmapLength = maxField > 64 ? 16 : 8;
  const bitmap = Buffer.alloc(bitmapLength);

  if (maxField > 64) {
    bitmap[0] |= 0x80;
  }

  for (const fieldNum of fields) {
    if (fieldNum === 1) continue;

    const byteIndex = Math.floor((fieldNum - 1) / 8);
    const bitIndex = 7 - ((fieldNum - 1) % 8);
    bitmap[byteIndex] |= 1 << bitIndex;
  }

  return bitmap;
}

// ---------------------------------------------------------------------------
// Message parsing
// ---------------------------------------------------------------------------

export function parseIsoMessage(buffer: Buffer): ParsedIsoMessage {
  let offset = 0;
  const mti = bcdToStr(buffer.subarray(offset, offset + 2), 4);
  offset += 2;

  const { bits, bitmapLength } = decodeBitmap(buffer.subarray(offset));
  const bitmap = buffer.subarray(offset, offset + bitmapLength);
  offset += bitmapLength;

  const fields: Map<number, ParsedIso8583Field> = new Map();

  for (const fieldNum of bits) {
    const format = ISO8583_FIELD_FORMATS[fieldNum.toString()];

    if (!format) {
      console.warn(`Campo ${fieldNum} não definido em formats`);
      continue;
    }

    const parsed = parseField(buffer, offset, format);

    fields.set(fieldNum, {
      field: fieldNum,
      value: parsed.value,
      raw: parsed.raw,
      length: parsed.raw.length,
      startOffset: offset,
      endOffset: parsed.newOffset,
    });

    offset = parsed.newOffset;
  }

  return { mti, bitmap, bits, fields, lastOffset: offset };
}

export function parseIsoFromBuffer(buffer: Buffer): Record<string, any> {
  try {
    const parsed = parseIsoMessage(buffer);
    const result: Record<string, any> = { '0': parsed.mti };

    for (const { field, value } of parsed.fields.values()) {
      result[field] = value;
    }

    return result;
  } catch (error: any) {
    return { error: `Failed to parse: ${error.message}` };
  }
}

export function parseJson(fields: Record<string, any>): string {
  return JSON.stringify(fields, null, 2);
}

export function parseXML(fields: Record<string, any>): string {
  let xml = '<?xml version="1.0" encoding="UTF-8"?>\n';
  xml += '<Iso8583PostXml>\n';
  xml += `  <MsgType>${fields['0'] || ''}</MsgType>\n`;
  xml += '  <Fields>\n';

  for (const [fieldNum, value] of Object.entries(fields)) {
    if (fieldNum === '0') continue;
    xml += `    <Field${fieldNum}>${value}</Field${fieldNum}>\n`;
  }

  xml += '  </Fields>\n';
  xml += '</Iso8583PostXml>\n';
  return xml;
}
