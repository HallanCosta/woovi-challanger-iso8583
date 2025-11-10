/**
 * utils to workings with BCD (Binary Coded Decimal) or ASCII (American Standard Code for Information Interchange)
 */

import formats from './formats.ts';

function bcdToStr(buffer: Buffer, length: number): string {
  let result = '';
  const bytesNeeded = Math.ceil(length / 2);

  for (let i = 0; i < bytesNeeded; i++) {
    const byte = buffer[i];
    const high = (byte >> 4) & 0x0F;
    const low = byte & 0x0F;

    result += high.toString();
    if (result.length < length) {
      result += low.toString();
    }
  }

  return result.substring(0, length);
}

function strToBCD(str: string, bytes: number): Buffer {
  const buffer = Buffer.alloc(bytes);
  for (let i = 0; i < bytes; i++) {
      const pos = i * 2;
      const highNibble = parseInt(str[pos] || '0', 10);
      const lowNibble = parseInt(str[pos + 1] || '0', 10);
      buffer[i] = (highNibble << 4) | lowNibble;
  }
  return buffer;
}

function llvarBCD(str: string): Buffer {
  const len = str.length.toString().padStart(2, '0'); // 2 dígitos
  return Buffer.concat([
    strToBCD(len, 1),
    strToBCD(str, Math.ceil(str.length / 2))
  ]);
}

function llvarASCII(str: string): Buffer {
  const len = str.length.toString().padStart(2, '0');
  return Buffer.concat([
    strToBCD(len, 1),
    Buffer.from(str, 'ascii')
  ]);
}

function amountToCurrency(value: string): string {
  const cents = parseInt(value, 10)
  return (cents / 100).toFixed(2)
}

/**
 * Describe os feidls parsed of message ISO8583
 * @param parsedFields - Fields parsed
 */
function describeFields(parsedFields: Record<string, any>): void {
  console.log('\n📋 DESCRIÇÃO DOS CAMPOS DA RESPOSTA:\n');

  for (const [fieldNum, value] of Object.entries(parsedFields)) {
    const format = formats[fieldNum];
    const label = format ? format.Label : 'Campo desconhecido';
    console.log(`DE${fieldNum}: ${label} - Valor: ${value}`);
  }
  console.log('');
}

export { bcdToStr, strToBCD, llvarBCD, llvarASCII, describeFields, amountToCurrency };

const utils = {
  bcdToStr,
  strToBCD,
  llvarBCD,
  llvarASCII,
  describeFields,
  amountToCurrency
};

export default utils;
