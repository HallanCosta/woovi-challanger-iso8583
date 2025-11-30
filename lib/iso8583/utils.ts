import ISO8583_FIELD_FORMATS from './formats.ts';

const pad = (value: string | number, size: number): string =>
  String(value).padStart(size, '0');

// ---------------------------------------------------------------------------
// BCD helpers
// ---------------------------------------------------------------------------

function bcdToStr(buffer: Buffer, length: number): string {
  let result = '';
  const bytes = Math.ceil(length / 2);

  for (let i = 0; i < bytes; i++) {
    const byte = buffer[i];
    result += ((byte >> 4) & 0x0f).toString();
    if (result.length < length) {
      result += (byte & 0x0f).toString();
    }
  }

  return result.slice(0, length);
}

function strToBCD(str: string, bytes: number): Buffer {
  const buffer = Buffer.alloc(bytes);

  for (let i = 0; i < bytes; i++) {
    const pos = i * 2;
    const high = parseInt(str[pos] ?? '0', 16);
    const low = parseInt(str[pos + 1] ?? '0', 16);
    buffer[i] = (high << 4) | low;
  }

  return buffer;
}

function llvarBCD(str: string): Buffer {
  const len = pad(str.length, 2);
  return Buffer.concat([strToBCD(len, 1), strToBCD(str, Math.ceil(str.length / 2))]);
}

function llvarASCII(str: string): Buffer {
  const len = pad(str.length, 2);
  return Buffer.concat([strToBCD(len, 1), Buffer.from(str, 'ascii')]);
}

// ---------------------------------------------------------------------------
// Helpers for logging/formatting
// ---------------------------------------------------------------------------

function amountToCurrency(value: string): string {
  const cents = parseInt(value, 10);
  return (cents / 100).toFixed(2);
}

function describeFields(parsedFields: Record<string, any>): void {
  console.log('\n📋 DESCRIÇÃO DOS CAMPOS DA RESPOSTA:\n');

  for (const [fieldNum, value] of Object.entries(parsedFields)) {
    const format = ISO8583_FIELD_FORMATS[fieldNum];
    const label = format ? format.Label : 'Campo desconhecido';
    console.log(`DE${fieldNum}: ${label} - Valor: ${value}`);
  }
  console.log('');
}

export { bcdToStr, strToBCD, llvarBCD, llvarASCII, describeFields, amountToCurrency };
