import type { Transaction } from '../../card/cardTypes.ts';
import { buildIso8583Message } from '../../../../../lib/iso8583/messages.ts';
import { buildFieldsFromTransaction, resolveProcessingCode } from '../helpers/buildFields.ts';

export const createAuthMessage = ({ transaction }: { transaction: Transaction }): Buffer => {
  const fields = buildFieldsFromTransaction({
    transaction,
    processingCode: resolveProcessingCode(transaction, '000000')
  });

  return buildIso8583Message({ mti: '0100', fields });
};
