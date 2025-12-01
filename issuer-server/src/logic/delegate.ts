import { CARD_LIST_HALLAN, HALLAN_MASTERCARD_CARDS } from '../data/cardListBanksHallan.ts';
import { HALLAN_BIN_PREFIXES } from '../data/bankHallan.ts';
import { deriveResponseMti } from '../../../lib/iso8583/parser.ts';
import { authorizationResponse } from './authorization.ts';
import { reversalResponse } from './reversal.ts';
import { saleResponse } from './sale.ts';
import { testResponse } from './testTransaction.ts';
import { voidResponse } from './void.ts';
import type { LogicResponse } from './types.ts';

export type DelegateInput = {
  mti: string;
  processingCode?: string;
  cardNumber?: string;
};

export type DelegateResult = LogicResponse & { issuerFound: boolean };

const cardIssuedByHallanBank = (cardNumber?: string): boolean => {
  if (!cardNumber) return true;
  if (HALLAN_BIN_PREFIXES.some((prefix) => cardNumber.startsWith(prefix))) return true;
  const lists = Object.values(CARD_LIST_HALLAN) as ReadonlyArray<readonly string[]>;
  return lists.some((list) => list.includes(cardNumber));
};

export const deriveExpectedCode = (cardNumber?: string): string => {
  if (!cardNumber) return '00';
  const code = HALLAN_MASTERCARD_CARDS[cardNumber as keyof typeof HALLAN_MASTERCARD_CARDS];
  return code ?? '00';
};

export const resolveDelegate = (input: DelegateInput): DelegateResult => {
  const expectedResponseCode = deriveExpectedCode(input.cardNumber);
  const processingCode = input.processingCode ?? '';

  if (!cardIssuedByHallanBank(input.cardNumber)) {
    return {
      issuerFound: false,
      mti: deriveResponseMti(input.mti, '0210'),
      responseCode: '15',
    };
  }

  if (input.mti === '0100') {
    return { issuerFound: true, ...authorizationResponse() };
  }

  if (input.mti === '0200') {
    if (processingCode === '020000' || processingCode === '220000') {
      return { issuerFound: true, ...voidResponse(expectedResponseCode, processingCode) };
    }

    return {
      issuerFound: true,
      ...saleResponse(expectedResponseCode, processingCode, input.cardNumber),
    };
  }

  if (input.mti === '0400') {
    return { issuerFound: true, ...reversalResponse(expectedResponseCode) };
  }

  if (input.mti === '0800') {
    return { issuerFound: true, ...testResponse() };
  }

  return { issuerFound: true, mti: deriveResponseMti(input.mti, '0210'), responseCode: '99' };
};
