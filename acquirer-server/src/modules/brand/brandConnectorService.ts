import { mastercardConnector } from './connectors/mastercardConnector.ts';
import { visaConnector } from './connectors/visaConnector.ts';
import { pixConnector } from './connectors/pixConnector.ts';
import { eloConnector } from './connectors/eloConnector.ts';
import { BRANDS } from './brands.ts';
import { startsWithAny } from './brandHelpers.ts';
import type { BrandConnectorResult } from './connectors/types.ts';
import type { Transaction } from '../card/cardTransaction.ts';

export async function brandRouteTransaction({ transaction }: { transaction: Transaction }): Promise<BrandConnectorResult> {
  const pan = transaction.cardNumber;

  if (startsWithAny({ value: pan, prefixes: BRANDS.MASTERCARD.prefixes })) {
    return mastercardConnector(transaction);
  }

  if (startsWithAny({ value: pan, prefixes: BRANDS.VISA.prefixes })) {
    return visaConnector(transaction);
  }

  if (startsWithAny({ value: pan, prefixes: BRANDS.ELO.prefixes })) {
    return eloConnector(transaction);
  }

  if (startsWithAny({ value: pan, prefixes: BRANDS.PIX.prefixes })) {
    return pixConnector(transaction);
  }

  // Unknown BIN: stop routing and signal unsupported brand
  return { type: 'noop', name: 'unknown-brand', message: `PAN ${pan} is not supported` };
}
