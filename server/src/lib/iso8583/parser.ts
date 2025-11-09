/**
 * ISO8583 Parser Functions
 */

import { bcdToStr } from './utils.ts';
import formats, { type ISO8583FieldFormat } from './formats.ts';

/**
 * Decodifica bitmap ISO8583
 * @param buffer - Buffer começando no bitmap
 * @returns { bits: Array, bitmapLength: number }
 */
function decodeBitmap(buffer: Buffer): { bits: number[], bitmapLength: number } {
  const bits: number[] = [];

  // Verifica se há bitmap estendido (bit 1 setado)
  const hasExtendedBitmap = (buffer[0] & 0x80) !== 0;
  const bitmapLength = hasExtendedBitmap ? 16 : 8;

  for (let byteIndex = 0; byteIndex < bitmapLength; byteIndex++) {
    const byte = buffer[byteIndex];

    for (let bitIndex = 7; bitIndex >= 0; bitIndex--) {
      const bitNumber = (byteIndex * 8) + (7 - bitIndex) + 1;

      // Pula o bit 1 se estiver no primeiro byte (indica bitmap estendido)
      if (bitNumber === 1) continue;

      if (byte & (1 << bitIndex)) {
        bits.push(bitNumber);
      }
    }
  }

  return { bits, bitmapLength };
}

/**
 * Cria bitmap a partir de array de campos
 * @param fields - Array de números de campos presentes
 * @returns Buffer contendo o bitmap
 */
function encodeBitmap(fields: number[]): Buffer {
  const maxField = Math.max(...fields);
  const bitmapLength = maxField > 64 ? 16 : 8;
  const bitmap = Buffer.alloc(bitmapLength);

  // Se tiver campos > 64, seta o bit 1 (bitmap estendido)
  if (maxField > 64) {
    bitmap[0] |= 0x80;
  }

  fields.forEach(fieldNum => {
    if (fieldNum === 1) return; // Pula campo 1 (bitmap)

    const byteIndex = Math.floor((fieldNum - 1) / 8);
    const bitIndex = 7 - ((fieldNum - 1) % 8);

    bitmap[byteIndex] |= (1 << bitIndex);
  });

  return bitmap;
}

/**
 * Helper function to parse a field
 * @param buffer - Buffer
 * @param offset - Current offset
 * @param format - Field format
 * @param fieldNum - Field number
 * @returns { value, newOffset, error? }
 */
function _parseField(buffer: Buffer, offset: number, format: ISO8583FieldFormat, fieldNum: number): { value: string | null, newOffset: number, error?: any } {
  let value = '';
  let newOffset = offset;

  try {
    const lenType = format.LenType;
    const contentType = format.ContentType;
    const maxLen = format.MaxLen;

    if (lenType === 'fixed') {
    if (contentType === 'n' && format.Format === 'BCD') {
    // BCD numeric
    const bytesNeeded = Math.ceil(maxLen / 2);
    value = bcdToStr(buffer.subarray(offset, offset + bytesNeeded), maxLen);
      newOffset += bytesNeeded;
    } else if (contentType === 'n' || contentType === 'a' || contentType === 'an') {
    // Numeric, alpha, or alphanumeric fixed as ASCII
    value = buffer.toString('ascii', offset, offset + maxLen);
      newOffset += maxLen;
      } else {
        // Default binary as hex
        value = buffer.toString('hex', offset, offset + maxLen);
        newOffset += maxLen;
      }
    } else if (lenType === 'llvar') {
      // Variable length, length field 2 digits BCD
      const lengthDigits = 2;
      const lenBytes = Math.ceil(lengthDigits / 2);
      const fieldLen = parseInt(bcdToStr(buffer.subarray(offset, offset + lenBytes), lengthDigits), 10);
      offset += lenBytes;
      if (contentType === 'n' || contentType === 'a' || contentType === 'an' || contentType === 'ans') {
        // Assume ASCII for variable
        value = buffer.toString('ascii', offset, offset + fieldLen);
        newOffset = offset + fieldLen;
      } else {
        // Default binary as hex
        value = buffer.toString('hex', offset, offset + fieldLen);
        newOffset = offset + fieldLen;
      }
    } else if (lenType === 'lllvar') {
      // Variable length, length field 3 digits BCD
      const lengthDigits = 3;
      const lenBytes = Math.ceil(lengthDigits / 2);
      const fieldLen = parseInt(bcdToStr(buffer.subarray(offset, offset + lenBytes), lengthDigits), 10);
      offset += lenBytes;
      if (contentType === 'n' || contentType === 'a' || contentType === 'an' || contentType === 'ans') {
        // Assume ASCII for variable
        value = buffer.toString('ascii', offset, offset + fieldLen);
        newOffset = offset + fieldLen;
      } else {
        // Default binary as hex
        value = buffer.toString('hex', offset, offset + fieldLen);
        newOffset = offset + fieldLen;
      }
    } else {
      // Unknown
      value = '';
      newOffset = offset;
    }
  } catch (error) {
    return { value: null, newOffset, error };
  }

  return { value, newOffset };
}

/**
 * Parse ISO8583 message from buffer
 * @param buffer - The ISO8583 message buffer (without length header)
 * @returns Parsed fields
 */
function parseIsoFromBuffer(buffer: Buffer): Record<string, any> {
  let offset = 0;
  const parsedFields: Record<string, any> = {};

  try {
    // 1. Parse MTI (4 dígitos = 2 bytes BCD)
    const mti = bcdToStr(buffer.subarray(offset, offset + 2), 4);
    parsedFields['0'] = mti;
    offset += 2;

    // 2. Parse Bitmap
    const { bits, bitmapLength } = decodeBitmap(buffer.subarray(offset));
    offset += bitmapLength;

    // 3. Parse cada campo presente no bitmap
    for (const fieldNum of bits) {
      const format = formats[fieldNum.toString()];

      if (!format) {
        console.warn(`Campo ${fieldNum} não definido em formats`);
        continue;
      }

      const fieldData = _parseField(buffer, offset, format, fieldNum);

      if (fieldData.error) {
        console.error(`Erro parsing campo ${fieldNum}:`, fieldData.error);
        break;
      }

      parsedFields[fieldNum] = fieldData.value;
      offset = fieldData.newOffset;
    }

    return parsedFields;

  } catch (error: any) {
    return { error: `Failed to parse: ${error.message}` };
  }
}

/**
 * Parse ISO8583 fields to JSON string
 * @param fields - Parsed fields
 * @returns JSON string
 */
function parseJson(fields: Record<string, any>): string {
  return JSON.stringify(fields, null, 2);
}

/**
 * Parse ISO8583 fields to XML string
 * @param fields - Parsed fields
 * @returns XML string
 */
function parseXML(fields: Record<string, any>): string {
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

const parser = {
  parseIsoFromBuffer,
  parseJson,
  parseXML,
  decodeBitmap,
  encodeBitmap
};

export default parser;
