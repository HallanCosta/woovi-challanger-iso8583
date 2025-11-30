import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import router from './routes.ts';
import { establishConnectionIssuer } from './tcpConnectionManager.ts';

const app = new Koa();

app.use(cors());
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

const PORT = Number(process.env.SERVER_PORT) || 4278;

app.listen(PORT, async () => {
  await establishConnectionIssuer();
  console.log(`[HTTP] Server listening at localhost:${PORT}`);
});
