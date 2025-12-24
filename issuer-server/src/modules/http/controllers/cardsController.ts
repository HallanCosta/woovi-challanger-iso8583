import { ISO8583_RESPONSE_CODES, ISO8583_RESPONSE_CODES_NAMES } from '../../../../../lib/iso8583/responseCodes.ts';
import { getAllCards } from '../../card/queries/getAllCards.ts';
import { findCard } from '../../card/queries/findCard.ts';
import { toBigIntOrNull } from '../../card/cardHelpers.ts';
import { getAccountsByIds } from '../../account/queries/getAccountsByIds.ts';

type CardContext = {
  request?: { body?: any };
  body: unknown;
  status: number;
};

export const listCards = (ctx: CardContext): void => {
  try {
    ctx.body = getAllCards();
  } catch (error) {
    console.error('[HTTP][CARDS] Falha ao listar cartões:', error);
    ctx.status = 500;
    ctx.body = { error: 'Erro ao consultar cartões.' };
  }
};

const detectBrand = (pan: string): string => {
  if (pan.startsWith('5162')) return 'Mastercard';
  if (pan.startsWith('4026')) return 'Visa';
  if (pan.startsWith('3907')) return 'Pix';
  return 'Unknown';
};

export const authorizeCardHttp = async (ctx: CardContext): Promise<void> => {
  const cardNumberRaw = ctx.request?.body?.cardNumber;
  const amountRaw = ctx.request?.body?.amount;

  if (!cardNumberRaw || amountRaw === undefined || amountRaw === null) {
    ctx.status = 400;
    ctx.body = { error: 'Parâmetros cardNumber e amount são obrigatórios.' };
    return;
  }

  const pan = String(cardNumberRaw).replace(/\s+/g, '');
  const amount = toBigIntOrNull(String(amountRaw));
  const card = findCard(pan);

  const brandName = detectBrand(pan);

  const responseFor = (rc: string) => {
    const desc = ISO8583_RESPONSE_CODES.find((code) => code.res === rc || code.req === rc)?.desc ?? '';

    return {
      authorized: rc === ISO8583_RESPONSE_CODES_NAMES.APPROVED,
      rc,
      message: desc,
      mti: '0110',
      type: 'Card',
      brandName,
    };
  };

  if (!card) {
    ctx.body = responseFor(ISO8583_RESPONSE_CODES_NAMES.INVALID_CARD);
    return;
  }

  if (amount === null || amount < 0) {
    ctx.body = responseFor(ISO8583_RESPONSE_CODES_NAMES.INVALID_AMOUNT);
    return;
  }

  const [debitAccount] = await getAccountsByIds([card.accountId]);
  if (!debitAccount) {
    ctx.body = responseFor(ISO8583_RESPONSE_CODES_NAMES.ISSUER_OR_SWITCH_INOPERATIVE);
    return;
  }

  const available = debitAccount.credits_posted - debitAccount.debits_posted;
  const rc = amount > available
      ? ISO8583_RESPONSE_CODES_NAMES.NOT_SUFFICIENT_FUNDS
      : ISO8583_RESPONSE_CODES_NAMES.APPROVED;

  ctx.body = {
    ...responseFor(rc),
    available: available.toString(),
  };
};
