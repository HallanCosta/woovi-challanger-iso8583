import { ACCOUNTS } from '../../account/__fixtures__/accounts.ts';
import { CARDS } from '../__fixtures__/cards.ts';

type CardBrand = 'MASTERCARD' | 'VISA' | 'PIX' | 'UNKNOWN';

export type CardView = {
  pan: string;
  accountId: string;
  accountName: string;
  brand: CardBrand;
};

const detectBrand = (pan: string): CardBrand => {
  if (pan.startsWith('5162')) return 'MASTERCARD';
  if (pan.startsWith('4026')) return 'VISA';
  if (pan.startsWith('3907')) return 'PIX';
  return 'UNKNOWN';
};

export const getAllCards = (): CardView[] =>
  CARDS.map((card) => {
    const account = ACCOUNTS.find((acc) => acc.id === card.accountId);
    const accountName = account?.name ?? 'Conta desconhecida';

    return {
      pan: card.pan,
      accountId: card.accountId.toString(),
      accountName,
      brand: detectBrand(card.pan),
    };
  });
