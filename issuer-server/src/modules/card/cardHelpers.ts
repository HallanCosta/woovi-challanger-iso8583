const VALID_PROCESSING_CODES = new Set(['000000', '200000', '900000']);

export const isValidProcessingCode = (processingCode: string): boolean =>
  VALID_PROCESSING_CODES.has(processingCode);
