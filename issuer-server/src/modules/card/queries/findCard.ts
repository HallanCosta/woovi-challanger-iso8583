import { type Card, CARDS } from '../__fixtures__/cards.ts';

export const findCard = (pan: string): Card | undefined => CARDS.find((c) => c.pan === pan);
