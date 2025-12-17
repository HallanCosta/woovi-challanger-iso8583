import type { Transaction } from '../card/cardTransaction.ts';
import { buildIso8583Message } from '../../../../lib/iso8583/messages.ts';
import { buildFieldsFromTransaction, resolveProcessingCode } from './buildFields.ts';

export const createVoidMessage = (transaction: Transaction): Buffer => {
  const de37 = Buffer.from('000001'.padEnd(12, ' '), 'ascii'); // Retrieval reference number
  const fields = buildFieldsFromTransaction({
    transaction,
    processingCode: resolveProcessingCode(transaction, '020000'),
    extraFields: [{ field: 37, value: de37 }]
  });

  return buildIso8583Message({ mti: '0200', fields });
};
