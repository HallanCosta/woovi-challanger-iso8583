import Router from '@koa/router';

import {
  listAccounts,
  showAccountLedger,
  showAccountWithLatestDebit,
} from './controllers/accountsController.ts';
import { authorizeCardHttp, listCards } from './controllers/cardsController.ts';
import { wipeLedger } from './controllers/wipeController.ts';

const router = new Router();

router.get('/', async (ctx) => {
  ctx.body = { message: 'Issuer server is running...' };
});

router.get('/accounts', listAccounts);
router.get('/accounts/:id', showAccountWithLatestDebit);
router.get('/accounts/:id/ledger', showAccountLedger);
router.get('/cards', listCards);
router.post('/cards/authorize', authorizeCardHttp);
router.post('/wipe', wipeLedger);

// Backward compatibility
router.get('/users/:id', showAccountWithLatestDebit);

export default router;
