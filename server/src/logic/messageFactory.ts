import type { Transaction } from '../types.ts';
import { buildIso8583Message, type IsoField } from '../../../lib/iso8583/messages.ts';
import { llvarASCII, strToBCD } from '../../../lib/iso8583/utils.ts';

type BaseBuildParams = {
  transaction: Transaction;
  mti: string;
  processingCode: string;
  extraFields?: IsoField[];
};

const buildFieldsFromTransaction = ({
  transaction,
  processingCode,
  extraFields = [],
}: Omit<BaseBuildParams, 'mti'>): IsoField[] => {
  const now = new Date();
  const pad = (num: number) => String(num).padStart(2, '0');
  const month = pad(now.getMonth() + 1);
  const day = pad(now.getDate());
  const hours = pad(now.getHours());
  const minutes = pad(now.getMinutes());
  const seconds = pad(now.getSeconds());

  const baseFields: IsoField[] = [
    { field: 2, value: llvarASCII(transaction.cardNumber) },
    { field: 3, value: strToBCD(processingCode, 3) },
    { field: 4, value: strToBCD(transaction.amount, 6) },
    { field: 7, value: strToBCD(`${month}${day}${hours}${minutes}${seconds}`, 5) },
    { field: 11, value: strToBCD(String(transaction.transactionId).padStart(6, '0'), 3) },
    { field: 12, value: strToBCD(`${hours}${minutes}${seconds}`, 3) },
    { field: 13, value: strToBCD(`${month}${day}`, 2) },
    { field: 32, value: strToBCD(transaction.acquirerInstitution, 7) },
    { field: 40, value: Buffer.from('002', 'hex') },
    { field: 41, value: strToBCD('98765432', 4) },
    { field: 42, value: Buffer.from(transaction.merchantId.padEnd(15, ' '), 'ascii') },
    { field: 49, value: strToBCD(transaction.currency, Math.ceil(transaction.currency.length / 2)) },
    {
      field: 57,
      value: Buffer.concat([
        Buffer.from('12', 'hex'),
        Buffer.from(
          '858f780ac38e1ac6d446fa103191326ce8316041dbb6f0f18b58eef445fad222c91ec8b6e9e343fea1dcc843a6c899bd9da3cc15eea019b6c30a027243fb640c',
          'hex'
        ),
      ]),
    },
  ];

  return [...baseFields, ...extraFields];
};

export const createPurchaseMessage = (transaction: Transaction): Buffer => {
  const fields = buildFieldsFromTransaction({
    transaction,
    processingCode: '000000',
  });

  return buildIso8583Message({ mti: '0200', fields });
};

export const createAuthMessage = (transaction: Transaction): Buffer => {
  const fields = buildFieldsFromTransaction({
    transaction,
    processingCode: '000000',
  });

  return buildIso8583Message({ mti: '0100', fields });
};

export const createVoidMessage = (transaction: Transaction): Buffer => {
  const de37 = Buffer.from('000001'.padEnd(12, ' '), 'ascii'); // Retrieval reference number
  const fields = buildFieldsFromTransaction({
    transaction,
    processingCode: '020000',
    extraFields: [{ field: 37, value: de37 }],
  });

  return buildIso8583Message({ mti: '0200', fields });
};

export const createReversalMessage = (transaction: Transaction): Buffer => {
  const de37 = Buffer.from('000001'.padEnd(12, ' '), 'ascii'); // Retrieval reference number
  const fields = buildFieldsFromTransaction({
    transaction,
    processingCode: '000000',
    extraFields: [{ field: 37, value: de37 }],
  });

  return buildIso8583Message({ mti: '0400', fields });
};
