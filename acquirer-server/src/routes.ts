import Router from '@koa/router';
import acquirer from './acquirer.ts';
import type { Transaction } from './types.ts';

const router = new Router();

router.get('/', async (ctx) => {
  ctx.body = { message: 'Server is running...' };
});

router.post('/transaction', async (ctx) => {
  const transaction = ctx.request.body as Transaction;

  if (!transaction || typeof transaction !== 'object') {
    ctx.status = 400;
    ctx.body = { error: 'Invalid transaction provided' };
    return;
  }

  try {
    const result = await acquirer(transaction);
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { error: error instanceof Error ? error.message : 'Unknown error' };
  }
});

export default router;
