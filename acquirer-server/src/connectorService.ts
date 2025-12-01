import { mastercardConnector } from './connectors/mastercardConnector.ts';
import { visaConnector } from './connectors/visaConnector.ts';
import { pixConnector } from './connectors/pixConnector.ts';
import { eloConnector } from './connectors/eloConnector.ts';
import { brandConnector } from './connectors/brandConnector.ts';
import { BRANDS_PREFIX } from './enums/brands.ts';
import type { ConnectorResult } from './connectors/types.ts';
import type { Transaction } from './types.ts';

const startsWithAny = (value: string, prefixes: readonly string[]): boolean =>
  prefixes.some((prefix) => value.startsWith(prefix));

export async function routeTransaction(transaction: Transaction): Promise<ConnectorResult> {
  const pan = transaction.cardNumber;

  if (startsWithAny(pan, BRANDS_PREFIX.MASTERCARD)) {
    return mastercardConnector(transaction);
  }

  if (startsWithAny(pan, BRANDS_PREFIX.VISA)) {
    return visaConnector(transaction);
  }

  if (startsWithAny(pan, ['636', '6504'])) {
    return eloConnector(transaction);
  }

  if (startsWithAny(pan, BRANDS_PREFIX.PIX)) {
    return pixConnector(transaction);
  }

  // Unknown BIN: still forward to brands server; it will validate and respond RC 15
  return brandConnector(transaction);
}
