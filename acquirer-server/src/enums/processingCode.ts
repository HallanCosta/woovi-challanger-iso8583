export const PROCESSING_CODE = {
  PIX: '900000',
  CARD: '000000'
} as const

export const PROCESSING_CODE_LABEL: Record<string, string> = {
  [PROCESSING_CODE.PIX]: 'Pix',
  [PROCESSING_CODE.CARD]: 'Card',
};
