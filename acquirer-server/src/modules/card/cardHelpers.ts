import { BRANDS } from '../brand/__fixtures__/brands.ts';

export const matchesPrefix = (cardNumber: string, prefixes: readonly string[]): boolean =>
  prefixes.some((prefix) => cardNumber.startsWith(prefix));

export const findBrandName = (cardNumber: string): string => {
  const entry = Object.values(BRANDS).find((brand) =>
    brand.prefixes.some((prefix) => cardNumber.startsWith(prefix))
  );

  return entry?.name ?? 'Unknown';
};
