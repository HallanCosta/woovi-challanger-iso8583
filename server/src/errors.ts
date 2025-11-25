export type IssuerNotFound = Error & {
  responseCode: string;
  brandName?: string;
  pan?: string;
  isIssuerNotFound: true;
};

export const createIssuerNotFoundError = (
  message = 'Issuer not found for this BIN',
  responseCode = '15',
  brandName?: string,
  pan?: string
): IssuerNotFound => {
  const err = new Error(message) as IssuerNotFound;
  err.name = 'IssuerNotFoundError';
  err.responseCode = responseCode;
  err.brandName = brandName;
  err.pan = pan;
  err.isIssuerNotFound = true;
  return err;
};

export const isIssuerNotFoundError = (err: unknown): err is IssuerNotFound => {
  return (
    typeof err === 'object' &&
    err !== null &&
    (err as any).isIssuerNotFound === true &&
    (err as any).name === 'IssuerNotFoundError'
  );
};
