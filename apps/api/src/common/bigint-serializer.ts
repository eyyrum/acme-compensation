/**
 * Prisma maps BIGINT to JS BigInt, which JSON.stringify throws on.
 * Salary values fit comfortably in a double (max safe integer is ~9e15;
 * a 10-crore salary in paise is 1e10), so narrowing at the API boundary
 * is lossless for this domain.
 */
export function serializeBigInt<T>(value: T): T {
  return JSON.parse(
    JSON.stringify(value, (_key, val) =>
      typeof val === 'bigint' ? Number(val) : val,
    ),
  ) as T;
}

/** Install once at bootstrap so nested BigInt anywhere in a response works. */
export function patchBigIntJson(): void {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (BigInt.prototype as any).toJSON = function () {
    return Number(this);
  };
}