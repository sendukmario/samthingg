"use client";

// import { useCustomizeTheme } from "@/hooks/use-customize-theme";
import QuickBuyButton from "@/components/customs/buttons/QuickBuyButton";
// import { useMemo } from "react";
import Image from "next/image";
import { getDataItems } from "@/components/customs/ignite-component/IgniteDataItems";
import { securityItems } from "@/components/customs/ignite-component/IgniteSecurityItems";
import { lowerSection } from "@/components/customs/ignite-component/IgniteLowerSection";
import Link from "next/link";
import { useCustomToast } from "@/hooks/use-custom-toast";
import SocialLinks from "@/components/customs/cards/partials/SocialLinks";
import {
  CheckmarkIconSVG,
  CopyIconSVG,
  EyeIconSVG,
  SearchIconSVG,
  WarningIconSVG,
  WebsitegreenIconSVG,
} from "@/components/customs/ScalableVectorGraphics";

import { IgniteToken } from "@/apis/rest/igniteTokens";

interface IgniteCardProps {
  token: IgniteToken;
  index?: number;
}

const IgniteCard: React.FC<IgniteCardProps> = ({ token, index = 0 }) => {
  // Derived display values from token data
  const formattedMarketCap = `$${(token.market_cap_usd ?? 0).toLocaleString()}`;
  const priceChange = token["1h"] ?? 0;
  const formattedChange = `${priceChange > 0 ? "+" : ""}${priceChange.toFixed(2)}%`;
  // const percentageColor = priceChange >= 0 ? "#49C78E" : "#F65B93";

  const { success: successToast } = useCustomToast();

  const handleCopyMint = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard.writeText(token.mint).then(() => {
      successToast("Mint copied to clipboard");
    });
  };

  return (
    <div className="flex flex-col items-center justify-center gap-2">
      {/* Card Layout */}
      <div
        key={index}
        className="flex w-[80%] items-center gap-4 rounded-[9px] px-4 py-3"
        style={{
          background:
            "linear-gradient(180deg, #1A1A23 46.24%, #12121F 112.24%)",
        }}
      >
        {/* Avatar */}
        <Image
          src={token?.image || "/images/sample-avatar.png"}
          alt="Avatar"
          width={60}
          height={60}
          className="aspect-square rounded-full"
        />

        {/* Token Information */}
        <div className="flex w-full flex-col gap-2">
          {/* Upper Section */}
          <div className="flex items-center justify-between">
            <div className="flex flex-col gap-1">
              <div className="flex items-center gap-1">
                {/* Token Name */}
                <p className="font-geistSemiBold text-base text-fontColorPrimary">
                  {token.name ?? "-"}
                </p>

                {/* Token Subname */}
                <p className="font-geistRegular text-xs text-fontColorSecondary">
                  {token.symbol ?? "-"}
                </p>

                {/* Eye Icon */}
                <EyeIconSVG />

                {/* Copy Icon */}
                <button
                  onClick={handleCopyMint}
                  title="Copy Mint"
                  className="duration-300 hover:brightness-200"
                >
                  <CopyIconSVG />
                </button>

                {/* Search Icon */}
                <Link
                  href={`https://x.com/search?q=${token.mint}`}
                  target="_blank"
                  title="Search Token"
                  className="duration-300 hover:brightness-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  <SearchIconSVG />
                </Link>

                <SocialLinks
                  dex={(token.dex as any) ?? ""}
                  isFirst={false}
                  twitter={token.twitter ?? undefined}
                  telegram={token.telegram ?? undefined}
                  website={token.website ?? undefined}
                  mint={token.mint}
                />
              </div>

              <div className="flex items-center gap-2">
                {/* Bundled / Not Bundled */}
                <div className="flex items-center gap-2">
                  <div
                    className={`flex items-center gap-1 rounded-full px-2 py-[1px] text-xs text-fontColorPrimary ${token.bundled ? "bg-[#F65B93]" : "bg-[#49C78E]"}`}
                  >
                    {token.bundled ? (
                      // Warning icon for Bundled
                      <WarningIconSVG />
                    ) : (
                      // Check mark icon for Not Bundled
                      <CheckmarkIconSVG />
                    )}

                    <span className="text-xs text-fontColorPrimary">
                      {token.bundled ? "Bundled" : "Not Bundled"}
                    </span>
                  </div>
                </div>

                {/* Discord Mentions */}
                {token.discord_mentions && token.discord_mentions > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 rounded-full bg-[#663CBD] px-2 py-[1px] text-xs text-fontColorPrimary">
                      {Array.from(
                        { length: token.discord_mentions },
                        (_, index) => (
                          <svg
                            key={index}
                            width="14"
                            height="15"
                            viewBox="0 0 14 15"
                            fill="none"
                            xmlns="http://www.w3.org/2000/svg"
                          >
                            <g clip-path="url(#clip0_48_3930)">
                              <path
                                d="M9.625 6.39995L4.375 3.37245"
                                stroke="white"
                                strokeWidth="1.16667"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M12.25 10.25V5.58329C12.2498 5.3787 12.1958 5.17776 12.0934 5.00064C11.991 4.82351 11.8438 4.67642 11.6667 4.57412L7.58333 2.24079C7.40598 2.1384 7.20479 2.08449 7 2.08449C6.79521 2.08449 6.59402 2.1384 6.41667 2.24079L2.33333 4.57412C2.15615 4.67642 2.00899 4.82351 1.9066 5.00064C1.80422 5.17776 1.75021 5.3787 1.75 5.58329V10.25C1.75021 10.4545 1.80422 10.6555 1.9066 10.8326C2.00899 11.0097 2.15615 11.1568 2.33333 11.2591L6.41667 13.5925C6.59402 13.6949 6.79521 13.7488 7 13.7488C7.20479 13.7488 7.40598 13.6949 7.58333 13.5925L11.6667 11.2591C11.8438 11.1568 11.991 11.0097 12.0934 10.8326C12.1958 10.6555 12.2498 10.4545 12.25 10.25Z"
                                stroke="white"
                                strokeWidth="1.16667"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M1.90747 4.97662L6.99997 7.92246L12.0925 4.97662"
                                stroke="white"
                                strokeWidth="1.16667"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                              <path
                                d="M7 13.7966V7.91663"
                                stroke="white"
                                strokeWidth="1.16667"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              />
                            </g>
                            <defs>
                              <clipPath id="clip0_48_3930">
                                <rect
                                  width="14"
                                  height="14"
                                  fill="white"
                                  transform="translate(0 0.916626)"
                                />
                              </clipPath>
                            </defs>
                          </svg>
                        ),
                      )}
                    </div>
                  </div>
                )}

                {/* Group */}
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1 rounded-full bg-[#29292F] px-2 py-[1px] text-xs text-fontColorPrimary">
                    <svg
                      key={index}
                      width="14"
                      height="15"
                      viewBox="0 0 14 15"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M13.3874 9.14161C13.3415 9.17608 13.2892 9.20117 13.2335 9.21542C13.1778 9.22968 13.1199 9.23284 13.063 9.22472C13.0062 9.21659 12.9515 9.19734 12.902 9.16807C12.8526 9.1388 12.8094 9.10007 12.7749 9.05411C12.5112 8.69966 12.168 8.41208 11.7729 8.2145C11.3777 8.01693 10.9417 7.9149 10.4999 7.91661C10.4139 7.9166 10.3298 7.89123 10.2581 7.84367C10.1864 7.7961 10.1303 7.72846 10.0969 7.64919C10.0742 7.59536 10.0625 7.53753 10.0625 7.47911C10.0625 7.42069 10.0742 7.36286 10.0969 7.30903C10.1303 7.22977 10.1864 7.16212 10.2581 7.11456C10.3298 7.06699 10.4139 7.04162 10.4999 7.04161C10.7454 7.04159 10.9859 6.97273 11.1943 6.84285C11.4026 6.71296 11.5703 6.52727 11.6783 6.30685C11.7864 6.08644 11.8304 5.84014 11.8055 5.59593C11.7806 5.35172 11.6877 5.11939 11.5374 4.92533C11.3871 4.73127 11.1853 4.58326 10.9551 4.49811C10.7249 4.41295 10.4754 4.39408 10.2349 4.44362C9.9945 4.49316 9.77279 4.60913 9.59497 4.77836C9.41715 4.9476 9.29035 5.1633 9.22898 5.40099C9.21462 5.45664 9.18944 5.50893 9.15487 5.55485C9.1203 5.60078 9.07702 5.63944 9.02751 5.66864C8.978 5.69784 8.92322 5.717 8.8663 5.72503C8.80938 5.73306 8.75144 5.7298 8.69578 5.71544C8.64012 5.70108 8.58784 5.67589 8.54191 5.64132C8.49599 5.60675 8.45732 5.56348 8.42812 5.51396C8.39892 5.46445 8.37976 5.40967 8.37173 5.35275C8.3637 5.29584 8.36696 5.23789 8.38133 5.18224C8.46651 4.85264 8.62744 4.54748 8.85131 4.29102C9.07518 4.03457 9.35581 3.8339 9.67089 3.70499C9.98596 3.57608 10.3268 3.52248 10.6662 3.54846C11.0056 3.57445 11.3343 3.67929 11.6261 3.85465C11.9179 4.03001 12.1647 4.27105 12.3469 4.55859C12.5292 4.84613 12.6418 5.17223 12.6758 5.51095C12.7098 5.84967 12.6643 6.19165 12.5429 6.50969C12.4215 6.82773 12.2276 7.11305 11.9765 7.34294C12.5714 7.60052 13.0885 8.00926 13.4766 8.52856C13.511 8.57464 13.5361 8.62707 13.5503 8.68284C13.5644 8.73862 13.5675 8.79664 13.5592 8.85358C13.5509 8.91053 13.5315 8.96528 13.502 9.01471C13.4725 9.06413 13.4336 9.10726 13.3874 9.14161ZM10.4409 12.5104C10.4725 12.5602 10.4938 12.6158 10.5033 12.6741C10.5129 12.7323 10.5106 12.7918 10.4966 12.8492C10.4825 12.9065 10.4571 12.9603 10.4217 13.0076C10.3863 13.0548 10.3417 13.0943 10.2906 13.1238C10.2395 13.1534 10.183 13.1723 10.1244 13.1794C10.0658 13.1865 10.0064 13.1817 9.94975 13.1652C9.89308 13.1488 9.84032 13.1211 9.79465 13.0837C9.74898 13.0464 9.71134 13.0001 9.68398 12.9479C9.40838 12.4812 9.01588 12.0945 8.54519 11.8258C8.0745 11.5571 7.54189 11.4158 6.99992 11.4158C6.45795 11.4158 5.92535 11.5571 5.45466 11.8258C4.98397 12.0945 4.59146 12.4812 4.31586 12.9479C4.28851 13.0001 4.25087 13.0464 4.20519 13.0837C4.15952 13.1211 4.10676 13.1488 4.05009 13.1652C3.99343 13.1817 3.93402 13.1865 3.87544 13.1794C3.81687 13.1723 3.76034 13.1534 3.70925 13.1238C3.65817 13.0943 3.61358 13.0548 3.57818 13.0076C3.54278 12.9603 3.5173 12.9065 3.50326 12.8492C3.48922 12.7918 3.48692 12.7323 3.4965 12.6741C3.50607 12.6158 3.52733 12.5602 3.55898 12.5104C3.98314 11.7816 4.62987 11.2081 5.40414 10.8741C4.96846 10.5405 4.64827 10.0788 4.48856 9.55386C4.32886 9.0289 4.33768 8.46709 4.51378 7.9474C4.68988 7.42772 5.02441 6.97628 5.47035 6.65654C5.91629 6.33681 6.45121 6.16486 6.99992 6.16486C7.54864 6.16486 8.08356 6.33681 8.52949 6.65654C8.97543 6.97628 9.30996 7.42772 9.48606 7.9474C9.66216 8.46709 9.67098 9.0289 9.51128 9.55386C9.35158 10.0788 9.03138 10.5405 8.5957 10.8741C9.36997 11.2081 10.0167 11.7816 10.4409 12.5104ZM6.99992 10.5416C7.34604 10.5416 7.68438 10.439 7.97217 10.2467C8.25996 10.0544 8.48426 9.78108 8.61671 9.46131C8.74916 9.14154 8.78382 8.78967 8.7163 8.4502C8.64877 8.11074 8.4821 7.79892 8.23736 7.55417C7.99262 7.30943 7.6808 7.14276 7.34133 7.07524C7.00186 7.00771 6.65 7.04237 6.33023 7.17482C6.01046 7.30728 5.73714 7.53158 5.54485 7.81936C5.35256 8.10715 5.24992 8.44549 5.24992 8.79161C5.24992 9.25574 5.4343 9.70086 5.76249 10.029C6.09067 10.3572 6.53579 10.5416 6.99992 10.5416ZM3.93742 7.47911C3.93742 7.36308 3.89133 7.2518 3.80928 7.16975C3.72723 7.08771 3.61595 7.04161 3.49992 7.04161C3.25444 7.04159 3.01389 6.97273 2.80559 6.84285C2.59729 6.71296 2.42959 6.52727 2.32153 6.30685C2.21348 6.08644 2.1694 5.84014 2.19431 5.59593C2.21922 5.35172 2.31212 5.11939 2.46245 4.92533C2.61278 4.73127 2.81452 4.58326 3.04476 4.49811C3.27499 4.41295 3.52449 4.39408 3.76492 4.44362C4.00534 4.49316 4.22706 4.60913 4.40488 4.77836C4.5827 4.9476 4.70949 5.1633 4.77086 5.40099C4.79987 5.51339 4.87234 5.60967 4.97234 5.66864C5.07233 5.72761 5.19166 5.74445 5.30406 5.71544C5.41647 5.68643 5.51275 5.61396 5.57172 5.51396C5.63069 5.41397 5.64752 5.29464 5.61852 5.18224C5.53334 4.85264 5.37241 4.54748 5.14854 4.29102C4.92467 4.03457 4.64403 3.8339 4.32896 3.70499C4.01389 3.57608 3.67308 3.52248 3.33365 3.54846C2.99422 3.57445 2.66554 3.67929 2.37376 3.85465C2.08198 4.03001 1.83515 4.27105 1.65292 4.55859C1.47069 4.84613 1.35808 5.17223 1.32405 5.51095C1.29003 5.84967 1.33553 6.19165 1.45693 6.50969C1.57833 6.82773 1.77229 7.11305 2.02336 7.34294C1.42906 7.60076 0.9125 8.00948 0.524922 8.52856C0.45523 8.62139 0.425267 8.7381 0.441626 8.85302C0.457984 8.96793 0.519323 9.07165 0.612148 9.14134C0.704974 9.21103 0.821683 9.24099 0.9366 9.22464C1.05152 9.20828 1.15523 9.14694 1.22492 9.05411C1.48862 8.69966 1.83185 8.41208 2.22699 8.2145C2.62213 8.01693 3.05814 7.9149 3.49992 7.91661C3.61595 7.91661 3.72723 7.87052 3.80928 7.78847C3.89133 7.70642 3.93742 7.59514 3.93742 7.47911Z"
                        fill="white"
                      />
                    </svg>

                    <span className="text-xs text-fontColorPrimary">
                      {token.launchpad ?? token.dex ?? "-"}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-8 text-fontColorPrimary">
              {/* Market Cap */}
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-1">
                  <WebsitegreenIconSVG />
                  <p className="font-geistSemiBold text-xs text-fontColorPrimary">
                    Market Cap
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <p className="font-geistBold text-sm text-[#49C78E]">
                    {formattedMarketCap}
                  </p>
                  <p className="font-geistSemiBold text-xs text-[#F65B93]">
                    {formattedChange}
                  </p>
                </div>
              </div>

              <QuickBuyButton
                module="ignite"
                variant="ignite"
                mintAddress={token.mint}
              />
            </div>
          </div>

          {/* Lower Section */}
          <div className="relative w-full items-center pt-2 text-xs">
            {/* Gradient Border */}
            <div
              className="absolute left-0 top-0 h-[2px] w-full rounded-[100px]"
              style={{
                background:
                  "linear-gradient(270deg, #8CD9B6 1.09%, rgba(140, 217, 182, 0.1) 75.27%)",
                opacity: "28%",
              }}
            />

            <div className="flex items-center gap-4">
              {lowerSection.map((section, sectionIdx) => {
                const items =
                  section.id === "Data" ? getDataItems(token) : securityItems;
                return (
                  <div
                    key={sectionIdx}
                    className="flex w-fit items-center rounded-md"
                    style={{
                      background:
                        "linear-gradient(180deg, #080811 0%, #272734 100%)",
                    }}
                  >
                    <div
                      className="flex items-center gap-1 rounded-md px-2 py-1"
                      style={{ background: "#272734" }}
                    >
                      {section.icon}
                      <span className="font-geistBold text-xs text-fontColorPrimary">
                        {section.id}
                      </span>
                    </div>

                    <div className="flex items-center">
                      {items.map((item, itemIdx) => (
                        <div
                          key={itemIdx}
                          className="flex items-center gap-1 px-2 py-1"
                        >
                          {item.icon}
                          <span className="text-xs text-fontColorPrimary">
                            {item.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IgniteCard;
