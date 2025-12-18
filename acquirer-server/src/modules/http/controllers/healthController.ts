import type Router from '@koa/router';

export const healthCheck: Router.Middleware = async (ctx) => {
  ctx.body = { message: 'Server is running...' };
};
