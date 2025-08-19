/**
 * Formats a number as a percentage string with optional `+` or `-` sign,
 * and applies suffixes (K, M, B, T) for large numbers.
 * Ensures the result (excluding the `%` symbol) fits within `maxDigits`.
 *
 * @param {number | string | null | undefined} value - The number or numeric string to format.
 * @param {number} [maxDigits=6] - Maximum number of characters allowed for the formatted number (default = 6).
 *
 * @returns {string} A formatted percentage string, e.g., "+1.2K%", "-999%", or "0%".
 *
 * @example
 * formatPercentage(1234567);         // "+1.23M%"
 * formatPercentage(null);            // "0%"
 * formatPercentage("-12.3456");      // "-12.34%"
 */
export function formatPercentage(
  value?: number | string | null,
  maxDigits: number = 6,
  withSign: boolean = true,
  applySuffix: boolean = true,
): string {
  if (value === undefined || value === null) return "0%";
  const num = typeof value === "string" ? parseFloat(value) : value;

  if (isNaN(num)) return "0%";

  const sign = num > 0 ? "+" : num < 0 ? "-" : "";
  const abs = Math.abs(num);

  const formatCompact = (val: number): string => {
    // Use Intl for reliable compact formatting
    const formatter = new Intl.NumberFormat("en", {
      notation: "compact",
      maximumFractionDigits: 2,
    });
    let compactStr = formatter.format(val);

    // Ensure result length within maxDigits
    while (compactStr.length > maxDigits && compactStr.includes(".")) {
      compactStr = compactStr.slice(0, -1);
    }

    return compactStr;
  };

  const formatted = applySuffix ? formatCompact(abs) : abs.toFixed(2);

  return `${withSign ? sign : ""}${formatted}%`;
}
