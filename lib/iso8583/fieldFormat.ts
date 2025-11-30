import ISO8583_FIELD_FORMATS from './formats.ts';

export const formatType = (field: number): string => {
  const fmt = ISO8583_FIELD_FORMATS[field.toString()];
  const content = fmt?.ContentType?.toUpperCase() ?? '';
  if (content === 'N') return 'N';
  if (content === 'A') return 'A';
  if (content === 'AN') return 'AN';
  if (content === 'ANS') return 'ANS';
  return 'B';
};

export const fieldFormat = {
  formatType,
};
