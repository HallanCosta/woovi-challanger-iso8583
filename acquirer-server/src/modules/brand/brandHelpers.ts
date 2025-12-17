type StartsWithAny = {
  value: string;
  prefixes: readonly string[];
}

export const startsWithAny = ({ value, prefixes }: StartsWithAny): boolean =>
  prefixes.some((prefix) => value.startsWith(prefix));
