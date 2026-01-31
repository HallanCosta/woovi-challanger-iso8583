import Koa from 'koa';
import cors from '@koa/cors';
import bodyParser from 'koa-bodyparser';

import router from './modules/http/routes.ts';

const HTTP_PORT = Number(process.env.SERVER_HTTP_PORT || 9102);

export function startIssuerHttpServer(): void {
  const app = new Koa();
  app.use(cors());
  app.use(bodyParser());
  app.use(router.routes()).use(router.allowedMethods());

  app.listen(HTTP_PORT, '0.0.0.0', () => {
    console.log(`[HTTP][ISSUER] Listening at http://0.0.0.0:${HTTP_PORT}`);
  });
}
