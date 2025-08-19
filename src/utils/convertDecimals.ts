export const convertDecimals = (
  str: string | number | undefined,
  decimals: number | undefined
): number => {
  if (str === undefined || isNaN(Number(str))) return 0;

  try {
    const value = typeof str === "string" ? BigInt(str) : BigInt(str.toString());
    const divisor = BigInt(10) ** BigInt(decimals || 0);
    // Convert back to number for UI — note: might lose precision here if very large
    return Number(value) / Number(divisor);
  } catch {
    return 0;
  }
};
