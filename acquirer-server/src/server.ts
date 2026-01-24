import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';

import router from './modules/http/routes.ts';

import { establishConnectionBrand } from './modules/brand/clients/brandClient.ts';

const app = new Koa();

app.use(cors());
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

const HTTP_PORT = Number(process.env.SERVER_HTTP_HTTP_PORT || 9100);

app.listen(HTTP_PORT, async () => {
  await establishConnectionBrand();
  console.log(`[HTTP][ACQUIRER] Listening at http://localhost:${HTTP_PORT}`);
});
