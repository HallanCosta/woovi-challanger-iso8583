import Router from '@koa/router';

import { healthCheck } from './controllers/healthController.ts';
import { processTransaction } from './controllers/transactionController.ts';

const router = new Router();

router.get('/', healthCheck);
router.post('/transaction', processTransaction);

export default router;
