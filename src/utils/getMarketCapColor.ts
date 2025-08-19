export const getMarketCapColor = (marketCap: number) => {
  if (typeof marketCap !== "number" || isNaN(marketCap)) {
    return "text-fontColorSecondary";
  }

  if (marketCap >= 100_000) return "text-success"; // 100k+
  if (marketCap >= 30_000) return "text-warning"; // 30k–99k
  if (marketCap === 15_000) return "text-[#66B0FF]"; // exactly 15k
  if (marketCap < 15_000) return "text-fontColorSecondary"; // <15k

  return "text-fontColorSecondary";
};
