export type CardLogicResponse = {
  mti: string;
  responseCode: string;
};

export type AuthorizationResult = {
  rc: string;
  buffer: Buffer;
  holdId?: bigint;
};

export type CaptureResult = {
  rc: string;
  buffer: Buffer;
};
