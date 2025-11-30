import type { LogicResponse } from './types.ts';

export const authorizationResponse = (): LogicResponse => ({
  mti: '0110',
  responseCode: '00',
});
