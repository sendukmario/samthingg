import { IgniteToken } from "@/apis/rest/igniteTokens";

const icons = {
  volume: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M9 10V5"
        stroke="#9191A4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M6 10V2"
        stroke="#9191A4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M3 10V7"
        stroke="#9191A4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  liquidity: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M10.9435 2.66699C10.8062 2.27859 10.4358 2.00033 10.0004 2.00033H2.00041C1.81715 2.00033 1.66707 2.14873 1.66707 2.33366C1.66707 2.51743 1.81579 2.66647 1.99944 2.66699C1.99976 2.66699 1.99912 2.66699 1.99944 2.66699L10.9435 2.66699ZM1.33374 3.48862V9.33366C1.33374 9.88594 1.78146 10.3337 2.33374 10.3337H11.0004C11.9209 10.3337 12.6671 9.58747 12.6671 8.66699V5.33366C12.6671 4.71792 12.3337 4.17886 11.8328 3.88921C11.677 3.79911 11.5515 3.67073 11.4653 3.52005C11.3104 3.61483 11.1303 3.66699 10.9435 3.66699H2.00041C1.75755 3.66699 1.52986 3.60206 1.33374 3.48862ZM0.33374 2.33366C0.33374 1.41402 1.07813 0.666992 1.99944 0.666992H10.0004C11.2891 0.666992 12.3337 1.71166 12.3337 3.00033C12.3337 3.00809 12.3336 3.01582 12.3333 3.02352C13.1306 3.48454 13.6671 4.34645 13.6671 5.33366V8.66699C13.6671 10.1398 12.4732 11.3337 11.0004 11.3337H2.33374C1.22917 11.3337 0.33374 10.4382 0.33374 9.33366V2.33366Z"
        fill="#9191A4"
      />
      <path
        d="M10 6C9.44772 6 9 6.44772 9 7C9 7.55229 9.44772 8 10 8C10.5523 8 11 7.55229 11 7C11 6.44772 10.5523 6 10 6Z"
        fill="#9191A4"
      />
    </svg>
  ),
  marketCap: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M6 7.50002C7.933 7.50002 9.5 5.93301 9.5 4.00002C9.5 2.06702 7.933 0.500015 6 0.500015C4.067 0.500015 2.5 2.06702 2.5 4.00002C2.5 5.93301 4.067 7.50002 6 7.50002Z"
        stroke="#9191A4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M4.105 6.94502L3.5 11.5L6 10L8.5 11.5L7.895 6.94002"
        stroke="#9191A4"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  ),
  holders: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M12.4385 8.61274C9.34296 8.88069 7.65384 10.5698 7.38588 13.6654C7.10663 10.5217 5.42633 8.96309 2.33325 8.61274C5.47522 8.25034 7.02349 6.70207 7.38588 3.5601C7.73623 6.65318 9.29481 8.33348 12.4385 8.61274Z"
        stroke="#9191A4"
        strokeWidth="1.26316"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12.3669 1.88333C12.3529 1.75927 12.248 1.66549 12.1231 1.66536C11.9983 1.66523 11.8932 1.7588 11.8789 1.88283C11.8123 2.46027 11.6408 2.85641 11.3721 3.12511C11.1034 3.3938 10.7073 3.56529 10.1298 3.63189C10.0058 3.6462 9.91223 3.75128 9.91235 3.87614C9.91248 4.00099 10.0063 4.10589 10.1303 4.11994C10.698 4.18424 11.1032 4.35569 11.3787 4.62623C11.6527 4.8953 11.8274 5.29088 11.8782 5.86253C11.8895 5.98936 11.9958 6.08656 12.1232 6.08641C12.2505 6.08627 12.3566 5.98884 12.3676 5.86198C12.4162 5.29999 12.5908 4.89549 12.8667 4.61966C13.1425 4.34383 13.547 4.16923 14.109 4.12058C14.2358 4.1096 14.3333 4.00349 14.3334 3.87616C14.3335 3.74883 14.2364 3.6425 14.1095 3.63124C13.5379 3.58046 13.1423 3.40572 12.8732 3.13169C12.6027 2.85617 12.4312 2.45101 12.3669 1.88333Z"
        fill="#9191A4"
      />
    </svg>
  ),
  buys: (
    <svg
      width="12"
      height="12"
      viewBox="0 0 16 16"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M10.066 5.05882C10.066 6.19588 9.14422 7.11765 8.00717 7.11765C6.87011 7.11765 5.94834 6.19588 5.94834 5.05882C5.94834 3.92177 6.87011 3 8.00717 3C9.14422 3 10.066 3.92177 10.066 5.05882Z"
        stroke="#9191A4"
        strokeWidth="1.17647"
        strokeLinejoin="round"
      />
      <path
        d="M8.00717 8.88235C6.25514 8.88235 4.87442 9.79641 4.14443 11.1542C3.65202 12.0701 4.49393 13 5.53379 13H10.4805C11.5204 13 12.3623 12.0701 11.8699 11.1542C11.1399 9.79641 9.7592 8.88235 8.00717 8.88235Z"
        stroke="#9191A4"
        strokeWidth="1.17647"
        strokeLinejoin="round"
      />
    </svg>
  ),
};

export function getDataItems(token: IgniteToken) {
  // Helper to compact large numbers e.g. 12345 => 12.3K
  const formatCompact = (num?: number): string => {
    if (num === undefined || num === null) return "-";
    if (Math.abs(num) < 1000) return num.toFixed(2).replace(/\.0+$/, "");
    const units = ["", "K", "M", "B", "T"];
    let unitIndex = 0;
    let value = num;
    while (Math.abs(value) >= 1000 && unitIndex < units.length - 1) {
      value /= 1000;
      unitIndex++;
    }
    return `${value.toFixed(1).replace(/\.0$/, "")}${units[unitIndex]}`;
  };

  return [
    {
      icon: icons.volume,
      value: `$${formatCompact(token.volume_usd)}`,
    },
    {
      icon: icons.liquidity,
      value: `$${formatCompact(token.liquidity_usd)}`,
    },
    {
      icon: icons.marketCap,
      value: `$${formatCompact(token.market_cap_usd)}`,
    },
    {
      icon: icons.holders,
      value: formatCompact(token.holders),
    },
    {
      icon: icons.buys,
      value: formatCompact(token.buys),
    },
  ];
}
