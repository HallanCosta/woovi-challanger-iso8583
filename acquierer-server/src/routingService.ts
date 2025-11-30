import { mastercardConnector } from './connectors/mastercardConnector.ts';
import { visaConnector } from './connectors/visaConnector.ts';
import { pixConnector } from './connectors/pixConnector.ts';
import { eloConnector } from './connectors/eloConnector.ts';
import { createIssuerNotFoundError } from './errors.ts';
import type { ConnectorResult } from './connectors/types.ts';
import type { Transaction } from './types.ts';

const startsWithAny = (value: string, prefixes: readonly string[]): boolean =>
  prefixes.some((prefix) => value.startsWith(prefix));

export async function routeTransaction(transaction: Transaction): Promise<ConnectorResult> {
  const pan = transaction.cardNumber;

  if (startsWithAny(pan, ['5162', '2306'])) {
    return mastercardConnector(transaction);
  }

  if (startsWithAny(pan, ['4026', '4815'])) {
    return visaConnector(transaction);
  }

  if (startsWithAny(pan, ['636', '6504'])) {
    return eloConnector(transaction);
  }

  if (startsWithAny(pan, ['3907', '3910'])) {
    return pixConnector(transaction);
  }

  throw createIssuerNotFoundError('Issuer not found for this BIN', '15', undefined, pan);
}
