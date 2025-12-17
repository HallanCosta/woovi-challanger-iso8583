export const TRANSACTION_STAGE = {
  AUTHORIZATION: 'authorization',
  FINANCIAL: 'financial',
} as const;

export type TransactionStage = (typeof TRANSACTION_STAGE)[keyof typeof TRANSACTION_STAGE];
