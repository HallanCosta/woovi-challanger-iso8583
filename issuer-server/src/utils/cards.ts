import { BANKS } from "../bank/banks.ts";
import { type Card, ISSUED_CARDS } from "../card/cards.ts";

export const findCard = (pan: string): Card | undefined => ISSUED_CARDS.find((c) => c.pan === pan);
