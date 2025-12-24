import type Router from '@koa/router';

import { acquirer } from '../../../acquirer.ts';
import type { Transaction } from '../../card/cardTypes.ts';

export const processTransaction: Router.Middleware = async (ctx) => {
  const transaction = ctx.request.body as Transaction;

  if (!transaction || typeof transaction !== 'object') {
    ctx.status = 400;
    ctx.body = { error: 'Invalid transaction provided' };
    return;
  }

  try {
    const result = await acquirer({ transaction });
    ctx.status = 200;
    ctx.body = result;
  } catch (error) {
    ctx.status = 200;
    ctx.body = {
      success: false,
      responseCode: '91',
      message: 'Issuer or switch is inoperative',
      type: 'Unknown',
      brandName: 'Unknown',
    };
    console.error('[ACQUIRER][HTTP] Erro ao processar transação', error);
  }
};
