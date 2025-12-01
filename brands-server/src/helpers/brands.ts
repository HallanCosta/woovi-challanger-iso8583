import { BRAND_PREFIX, BRANDS_PREFIX_ALL, type BrandKey } from '../enums/brands.ts';
import { type BankKey } from '../enums/banks.ts';

const matchesPrefix = (value: string, prefixes: readonly string[]): boolean =>
  prefixes.some((prefix) => value.startsWith(prefix));

export const findBrandByPan = (pan: string): BrandKey | null => {
  for (const [brand, prefixes] of Object.entries(BRANDS_PREFIX_ALL) as [
    BrandKey,
    readonly string[],
  ][]) {
    if (matchesPrefix(pan, prefixes)) return brand;
  }

  return null;
};

export const findBankByPan = (pan: string): BankKey | null => {
  for (const brand of Object.values(BRAND_PREFIX) as Record<BankKey, readonly string[]>[]) {
    for (const [bank, prefixes] of Object.entries(brand) as [BankKey, readonly string[]][]) {
      if (matchesPrefix(pan, prefixes)) return bank;
    }
  }

  return null;
};

export const findBrandAndBankByPan = (
  pan: string,
): { brand: BrandKey; bank: BankKey } | null => {
  const brand = findBrandByPan(pan);
  const bank = findBankByPan(pan);

  if (brand && bank) {
    return { brand, bank };
  }

  return null;
};
