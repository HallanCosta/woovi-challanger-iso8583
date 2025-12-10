import { formatType } from '../../../lib/iso8583/fieldFormat.ts';
import { type ParsedIso8583Message, type ParsedIso8583Field } from '../../../lib/iso8583/parser.ts';
import { getResponseMti } from '../../../lib/iso8583/response.ts';
import ISO8583_FIELD_FORMATS from '../../../lib/iso8583/formats.ts';

type LogMessageInput = {
  message: Buffer;
  parsed: ParsedIso8583Message;
  fields: ParsedIso8583Field[];
  rc: string;
  mliDec: number;
  mliHex: string;
  buffer: Buffer;
};

export const logMessage = ({ message, parsed, fields, rc, mliDec, mliHex, buffer }: LogMessageInput): void => {
  const hexMessage = message.toString('hex').toUpperCase();
  const headerHex = message.subarray(0, 7).toString('hex').toUpperCase();
  const bitmapHex = parsed.bitmap.toString('hex').toUpperCase();
  const reqFields = Array.from(parsed.fields.values()).sort((a, b) => a.field - b.field);
  const amount = parsed.fields.get(4)?.value ?? 'unknown';
  const processingCode = parsed.fields.get(3)?.value ?? '000000';

  console.log('\n ========== REQUEST ========== \n');
  console.log(`[ISSUER][HALLAN][REQ] Header (Len + TPDU):${headerHex}`);
  console.log(`[ISSUER][HALLAN][REQ] ISO Bitmap = ${bitmapHex}`);
  console.log(`[ISSUER][HALLAN][REQ] MTI = ${parsed.mti}`);
  console.log(`[ISSUER][HALLAN][REQ] RC = ${rc}`);
  console.log(`[ISSUER][HALLAN][REQ] Data Received : ${hexMessage}\n`);

  for (const field of reqFields) {
    console.log(
      `[ISSUER][HALLAN][REQ] DE${field.field} | Type ${formatType(field.field)} | Value = ${field.value}`
    );
  }

  console.log('\n ========== RESPONSE ========== \n');
  console.log(`[ISSUER][HALLAN][RES] Msg Length (in Hex):${mliHex}`);
  console.log(`[ISSUER][HALLAN][RES] Encoded to: ${buffer.length} bytes`);
  console.log(`[ISSUER][HALLAN][RES] Data Sent: ${buffer.toString('hex').toUpperCase()}\n`);

  for (const field of fields) {
    const fmt = ISO8583_FIELD_FORMATS[field.field.toString()];
    const isBinary = fmt?.Format?.toLowerCase() === 'binary' || fmt?.ContentType === 'b';
    const displayValue = isBinary ? field.raw.toString('hex') : field.value;
    console.log(
      `[ISSUER][HALLAN][RES] DE${field.field}: ${displayValue}`
    );
  }

  console.log('\n ======= SUMMARY =======');
  console.log(`[ISSUER][HALLAN] MTI ${getResponseMti({ requestMti: parsed.mti })}`);
  console.log(`[ISSUER][HALLAN] ProcessingCode ${processingCode}`);
  console.log(`[ISSUER][HALLAN] Amount ${amount}`);
  console.log(`[ISSUER][HALLAN] RC ${rc}`);
};
