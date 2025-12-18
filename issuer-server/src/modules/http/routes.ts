import Router from '@koa/router';

import { showAccountWithLatestDebit } from './controllers/accountsController.ts';

const router = new Router();

router.get('/', async (ctx) => {
  ctx.body = { message: 'Server is running...' };
});

router.get('/users/:id', showAccountWithLatestDebit);

export default router;
