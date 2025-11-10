import Koa from 'koa';
import bodyParser from 'koa-bodyparser';
import cors from '@koa/cors';
import router from './routes.ts';

const app = new Koa();


app.use(cors());
app.use(bodyParser());
app.use(router.routes()).use(router.allowedMethods());

const PORT = Number(process.env.SERVER_PORT) || 4000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
