import { formatType } from '../../../lib/iso8583/fieldFormat.ts';
import { type ParsedIsoMessage, type ParsedIso8583Field } from '../../../lib/iso8583/parser.ts';
import ISO8583_FIELD_FORMATS from '../../../lib/iso8583/formats.ts';
import { deriveExpectedCode } from '../logic/delegate.ts';

type LogRequestInput = {
  message: Buffer;
  parsed: ParsedIsoMessage;
  cardNumber: string;
};

type LogResponseInput = {
  fields: ParsedIso8583Field[];
  rc: string;
  mliDec: number;
  mliHex: string;
  buffer: Buffer;
};

export const logRequest = ({ message, parsed, cardNumber }: LogRequestInput): void => {
  const hexMessage = message.toString('hex').toUpperCase();
  const headerHex = message.subarray(0, 7).toString('hex').toUpperCase();
  const bitmapHex = parsed.bitmap.toString('hex').toUpperCase();
  const fields = Array.from(parsed.fields.values()).sort((a, b) => a.field - b.field);

  const codeResponse = deriveExpectedCode(cardNumber)

  console.log('\n ========== REQUEST ========== \n');
  console.log(`[ISSUER][HALLAN][REQ] Header (Len + TPDU):${headerHex}`);
  console.log(`[ISSUER][HALLAN][REQ] ISO Bitmap = ${bitmapHex}`);
  console.log(`[ISSUER][HALLAN][REQ] MTI = ${parsed.mti}`);
  console.log(`[ISSUER][HALLAN][REQ] RC = ${codeResponse}`);
  console.log(`[ISSUER][HALLAN][REQ] Data Received : ${hexMessage}\n`);

  for (const field of fields) {
    console.log(
      `[ISSUER][HALLAN][REQ] DE${field.field} | Type ${formatType(field.field)} | Value = ${field.value}`
    );
  }
};

export const logResponse = ({
  fields,
  rc,
  mliDec,
  mliHex,
  buffer
}: LogResponseInput): void => {
  console.log('\n ========== RESPONSE ========== \n');

  // console.log(`[ISSUER][HALLAN][RES] Msg Length (in Decimal) :${mliDec}`);
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
};
