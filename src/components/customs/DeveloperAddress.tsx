"use client";

import React, {
  useState,
  useCallback,
  useMemo,
  useRef,
  useEffect,
} from "react";
import Image from "next/image";
import { useSearchParams } from "next/navigation";
import { useUserWalletStore } from "@/stores/wallet/use-user-wallet.store";
import { Wallet } from "@/apis/rest/wallet-manager";
import { truncateAddress } from "@/utils/truncateAddress";
import {
  getDeveloperAddress,
  DeveloperAddressData,
  FunderData,
} from "@/apis/rest/developer-address";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";

const DeveloperAddress = () => {
  console.log("🔍 DeveloperAddress component mounted/re-rendered");

  const searchParams = useSearchParams();
  let mint = searchParams?.get("token") || "";

  // Fallback: Extract mint from URL pathname if searchParams is empty
  if (!mint && typeof window !== "undefined") {
    const pathname = window.location.pathname;
    const tokenMatch = pathname.match(/\/token\/([^/?]+)/);
    if (tokenMatch) {
      mint = tokenMatch[1];
      console.log("🔄 Using fallback mint extraction from pathname:", mint);
    }
  }

  console.log("🔍 DeveloperAddress - searchParams:", searchParams?.toString());
  console.log("🔍 DeveloperAddress - mint parameter:", mint);
  console.log("🔍 DeveloperAddress - all searchParams:", {
    token: searchParams?.get("token"),
    symbol: searchParams?.get("symbol"),
    name: searchParams?.get("name"),
  });

  const [selectedFunder, setSelectedFunder] = useState<FunderData | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Developer address data state
  const [developerData, setDeveloperData] = useState<DeveloperAddressData>({});
  const [isDeveloperDataLoading, setIsDeveloperDataLoading] = useState(false);
  const [developerDataError, setDeveloperDataError] = useState<Error | null>(
    null,
  );

  // Component mount debugging
  useEffect(() => {
    console.log(
      "🎯 DeveloperAddress component MOUNTED - this confirms the component is rendering",
    );
    console.log("🎯 Initial mint value on mount:", mint);
    console.log("🎯 Current URL:", window.location.href);
    console.log("🎯 Current pathname:", window.location.pathname);

    return () => {
      console.log("🎯 DeveloperAddress component UNMOUNTED");
    };
  }, []);

  // Fetch developer address data on mount and when mint changes (initial load without wallet filter)
  useEffect(() => {
    // Create AbortController for request cancellation
    const abortController = new AbortController();

    const fetchDeveloperAddressData = async () => {
      console.log("🔍 fetchDeveloperAddressData called with:", {
        mint,
        selectedFunder: selectedFunder?.wallet,
      });

      if (!mint?.trim()) {
        console.log("❌ No mint parameter found, skipping API call");
        setDeveloperData({});
        setIsDeveloperDataLoading(false);
        setDeveloperDataError(null);
        return;
      }

      console.log("✅ Mint found, proceeding with API call");

      // Make immediate API call without debouncing for testing
      const makeApiCall = async () => {
        if (abortController.signal.aborted) return;

        setIsDeveloperDataLoading(true);
        setDeveloperDataError(null);

        try {
          console.log(
            "🚀 Making API call to getDeveloperAddress with:",
            { mint, wallet: selectedFunder?.wallet },
          );
          const result = await getDeveloperAddress(
            mint,
            abortController.signal,
            selectedFunder?.wallet, // Pass selected funder wallet if any
          );
          console.log("✅ API call successful, result:", result);

          // Only update state if component is still mounted and request wasn't aborted
          if (!abortController.signal.aborted) {
            setDeveloperData(result);
            console.log("✅ Developer data state updated");
            
            // Set default selected funder if none selected and we have funders data
            if (!selectedFunder && (result.funders?.length || result.funder)) {
              const defaultFunder = result.funders?.[0] || result.funder;
              if (defaultFunder) {
                setSelectedFunder(defaultFunder);
                console.log("✅ Default funder selected:", defaultFunder.wallet);
              }
            }
          }
        } catch (error) {
          console.log("❌ API call failed:", error);
          // Only handle errors if request wasn't aborted
          if (!abortController.signal.aborted) {
            const err =
              error instanceof Error
                ? error
                : new Error("Failed to fetch developer address");
            setDeveloperDataError(err);
            setDeveloperData({});
          }
        } finally {
          // Only update loading state if request wasn't aborted
          if (!abortController.signal.aborted) {
            setIsDeveloperDataLoading(false);
          }
        }
      };

      // Call immediately for testing - remove debounce temporarily
      makeApiCall();
    };

    fetchDeveloperAddressData();

    // Cleanup function to cancel requests
    return () => {
      abortController.abort();
    };
  }, [mint]); // Initial fetch only depends on mint

  // Get available funders from API response
  const availableFunders = useMemo(() => {
    if (developerData?.funders?.length) {
      return developerData.funders;
    }
    if (developerData?.funder) {
      return [developerData.funder];
    }
    return [];
  }, [developerData]);

  // Handle funder selection and redirect to Solscan account page
  const handleFunderSelect = useCallback((funder: FunderData) => {
    setSelectedFunder(funder);
    setIsDropdownOpen(false);
    
    // Redirect to Solscan account page for the selected funder
    const solscanUrl = `https://solscan.io/account/${funder.wallet}`;
    window.open(solscanUrl, "_blank", "noopener,noreferrer");
  }, []);

  // Handle click outside to close dropdown
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsDropdownOpen(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [isDropdownOpen]);

  // Memoized funder display text
  const selectedFunderDisplay = useMemo(() => {
    if (!selectedFunder) return "Select Funder";
    return truncateAddress(selectedFunder.wallet);
  }, [selectedFunder]);

  // Memoized developer address display with custom truncation
  const developerAddressDisplay = useMemo(() => {
    // Use API data for developer address
    const address = developerData?.developer;
    if (!address) return "No developer address";
    if (address.length <= 24) return address;
    // Custom truncation: show first 12 and last 8 characters
    return `${address.slice(0, 12)}...${address.slice(-8)}`;
  }, [developerData?.developer]);

  // Handle maximize icon click to open Solscan developer account page
  const handleMaximizeClick = useCallback(() => {
    const developerAddress = developerData?.developer;
    if (developerAddress) {
      const solscanUrl = `https://solscan.io/account/${developerAddress}`;
      window.open(solscanUrl, "_blank", "noopener,noreferrer");
    } else {
      console.warn("No developer address available for Solscan link");
    }
  }, [developerData?.developer]);

  // Format amount from lamports to SOL (assuming 1 SOL = 1,000,000,000 lamports)
  const formatAmount = useCallback((amount?: number) => {
    if (typeof amount !== "number") return "0.00";
    const sol = amount / 1000000000; // Convert lamports to SOL
    return sol.toFixed(2);
  }, []);

  // Format time ago from timestamp
  const formatTimeAgo = useCallback((timestamp?: number) => {
    if (!timestamp) return "N/A";
    const now = Math.floor(Date.now() / 1000);
    const diffSeconds = now - timestamp;
    const diffDays = Math.floor(diffSeconds / (24 * 60 * 60));

    if (diffDays === 0) return "Today";
    
    // If more than 31 days, show in months
    if (diffDays > 31) {
      const diffMonths = Math.floor(diffDays / 30); // Approximate months
      return diffMonths === 1 ? "1 month" : `${diffMonths} months`;
    }
    
    // If 31 days or less, show in days
    return diffDays === 1 ? "1 day" : `${diffDays} days`;
  }, []);
  return (
    <div className="flex flex-col items-start justify-center self-stretch rounded-lg border border-[#242436] bg-[#080811]">
      {/* Developer Address Title */}
      <div className="flex items-center justify-between self-stretch px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1">
            {/* Person Icon */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="14"
              height="16"
              viewBox="0 0 14 16"
              fill="none"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.99992 1C5.38909 1 4.08325 2.30584 4.08325 3.91667C4.08325 5.5275 5.38909 6.83333 6.99992 6.83333C8.61074 6.83333 9.91659 5.5275 9.91659 3.91667C9.91659 2.30584 8.61074 1 6.99992 1ZM5.24992 3.91667C5.24992 2.95017 6.03339 2.16667 6.99992 2.16667C7.96644 2.16667 8.74992 2.95017 8.74992 3.91667C8.74992 4.88316 7.96644 5.66667 6.99992 5.66667C6.03339 5.66667 5.24992 4.88316 5.24992 3.91667Z"
                fill="#9191A4"
                stroke="#9191A4"
                strokeWidth="0.2"
              />
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.74069 8C3.34002 8 0.583252 10.7568 0.583252 14.1574C0.583252 14.6228 0.960494 15 1.42584 15H12.574C13.0393 15 13.4166 14.6228 13.4166 14.1574C13.4166 10.7568 10.6598 8 7.25915 8H6.74069ZM7.25915 9.16667C9.90661 9.16667 12.0726 11.228 12.2396 13.8333H1.76027C1.92725 11.228 4.09322 9.16667 6.74069 9.16667H7.25915Z"
                fill="#9191A4"
                stroke="#9191A4"
                strokeWidth="0.2"
              />
            </svg>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="cursor-help font-geistRegular text-[14px] font-medium leading-[18px] text-[#9191A4]">
                    DA:
                  </p>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Developer Address</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
          {/* Selected Developer Address */}
          <p className="break-all font-geistMedium text-[14px] leading-[18px] text-fontColorPrimary">
            {developerAddressDisplay}
          </p>
        </div>
        {/* Maximize Icon */}
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="14"
          height="14"
          viewBox="0 0 14 14"
          fill="none"
          className="cursor-pointer"
          onClick={handleMaximizeClick}
          // title={developerData?.funder?.tx_hash ? 'View transaction on Solscan' : 'No transaction available'}
        >
          <g clipPath="url(#clip0_0_5217)">
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M6.7915 5.97119L11.0127 1.75H8.64062V0H14V5.35938H12.25V2.9873L8.02881 7.2085L6.7915 5.97119ZM14 7H12.25V12.25H1.75V1.75H7V0H0V14H14V7Z"
              fill="#DF74FF"
            />
          </g>
          <defs>
            <clipPath id="clip0_0_5217">
              <rect width="14" height="14" fill="white" />
            </clipPath>
          </defs>
        </svg>
      </div>
      <div className="flex items-center justify-center gap-1 self-stretch border-t border-[#242436] bg-white/[0.04] px-[8px] py-2">
        {/* Funder Wallet Selection */}
        <div className="relative" ref={dropdownRef}>
          <div
            className="flex w-[150px] cursor-pointer items-center gap-2 rounded border border-[#242436] bg-white/[0.04] px-2 py-1 transition-colors hover:bg-white/[0.06]"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <div className="flex flex-1 flex-col items-start gap-0.5">
              <p className="self-stretch font-geistRegular text-xs font-normal leading-normal tracking-[-0.12px] text-fontColorSecondary">
                Funder Wallet
              </p>
              <div className="flex items-start justify-between self-stretch">
                <span className="h-5 flex-1 flex-shrink-0 font-geistRegular text-[14px] font-medium leading-[18px] text-fontColorPrimary">
                  {selectedFunderDisplay}
                </span>
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="18"
                  height="18"
                  viewBox="0 0 18 18"
                  fill="none"
                  className=""
                >
                  <rect
                    width="18"
                    height="18"
                    rx="2"
                    fill="white"
                    fillOpacity="0.08"
                  />
                  <path
                    d="M6 7.5L8.20451 9.70451C8.64385 10.1438 9.35616 10.1438 9.79549 9.7045L12 7.5"
                    stroke="#FCFCFD"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </div>
          </div>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute left-0 top-full z-50 mt-1 max-h-[200px] w-full max-w-[200px] overflow-y-auto rounded-lg border border-[#242436] bg-[#080811] shadow-lg">
              {availableFunders.length > 0 ? (
                availableFunders.map((funder, index) => (
                  <div
                    key={funder.wallet}
                    className={`cursor-pointer border-b border-[#242436] px-3 py-2 transition-colors last:border-b-0 hover:bg-white/[0.04] ${
                      selectedFunder?.wallet === funder.wallet
                        ? "bg-white/[0.06]"
                        : ""
                    }`}
                    onClick={() => handleFunderSelect(funder)}
                  >
                    <div className="flex items-center gap-2">
                      <div className="relative aspect-square h-4 w-4 flex-shrink-0">
                        <Image
                          src="/icons/wallet.png"
                          alt="Funder Icon"
                          fill
                          quality={50}
                          unoptimized
                          className="object-contain"
                        />
                      </div>
                      <div className="flex min-w-0 flex-1 flex-col gap-1">
                        <p className="truncate font-geistMedium text-xs text-fontColorPrimary">
                          Funder {index + 1}
                        </p>
                        <p className="font-geistRegular text-xs text-fontColorSecondary">
                          {truncateAddress(funder.wallet)}
                        </p>
                        <p className="font-geistRegular text-xs text-fontColorSecondary">
                          {formatAmount(funder.amount)} SOL
                        </p>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="px-3 py-2 text-xs text-fontColorSecondary">
                  {isDeveloperDataLoading ? "Loading funders..." : "No funders available"}
                </div>
              )}
            </div>
          )}
        </div>
        <div className="flex flex-[1_0_0] items-center gap-2 rounded px-2 py-1">
          <div className="flex flex-[1_0_0] flex-col items-start gap-0.5">
            <p className="self-stretch font-geistRegular text-xs font-normal leading-normal tracking-[-0.12px] text-fontColorSecondary">
              Amount funded
            </p>
            <div className="flex h-5 items-center justify-center gap-0.5">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
              >
                <path
                  d="M3.94925 10.7074C4.02166 10.6282 4.12122 10.582 4.22682 10.582H13.8029C13.9779 10.582 14.0654 10.813 13.9417 10.9483L12.05 13.0171C11.9776 13.0963 11.878 13.1425 11.7724 13.1425H2.19635C2.02136 13.1425 1.93387 12.9115 2.05757 12.7762L3.94925 10.7074Z"
                  fill="url(#paint0_linear_0_5230)"
                />
                <path
                  d="M3.94925 2.98305C4.02468 2.90386 4.12424 2.85767 4.22682 2.85767H13.8029C13.9779 2.85767 14.0654 3.08863 13.9417 3.22392L12.05 5.29273C11.9776 5.37192 11.878 5.41811 11.7724 5.41811H2.19635C2.02136 5.41811 1.93387 5.18714 2.05757 5.05186L3.94925 2.98305Z"
                  fill="url(#paint1_linear_0_5230)"
                />
                <path
                  d="M12.05 6.82057C11.9776 6.74138 11.878 6.69519 11.7724 6.69519H2.19635C2.02136 6.69519 1.93387 6.92616 2.05757 7.06144L3.94925 9.13025C4.02166 9.20944 4.12122 9.25563 4.22682 9.25563H13.8029C13.9779 9.25563 14.0654 9.02467 13.9417 8.88939L12.05 6.82057Z"
                  fill="url(#paint2_linear_0_5230)"
                />
                <defs>
                  <linearGradient
                    id="paint0_linear_0_5230"
                    x1="12.8881"
                    y1="1.62195"
                    x2="5.28091"
                    y2="14.9453"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00FFA3" />
                    <stop offset="1" stopColor="#DC1FFF" />
                  </linearGradient>
                  <linearGradient
                    id="paint1_linear_0_5230"
                    x1="9.99025"
                    y1="-0.0327791"
                    x2="2.38304"
                    y2="13.2906"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00FFA3" />
                    <stop offset="1" stopColor="#DC1FFF" />
                  </linearGradient>
                  <linearGradient
                    id="paint2_linear_0_5230"
                    x1="11.43"
                    y1="0.789409"
                    x2="3.82275"
                    y2="14.1128"
                    gradientUnits="userSpaceOnUse"
                  >
                    <stop stopColor="#00FFA3" />
                    <stop offset="1" stopColor="#DC1FFF" />
                  </linearGradient>
                </defs>
              </svg>
              <p className="font-geistMedium text-sm leading-[18px] text-fontColorPrimary">
                {isDeveloperDataLoading
                  ? "Loading..."
                  : formatAmount(selectedFunder?.amount)}
              </p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 rounded-lg border border-[#242436] bg-[rgba(255,255,255,0.04)] px-2 py-1.5">
          <div className="flex items-center gap-1">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
            >
              <g clipPath="url(#clip0_0_5234)">
                <path
                  d="M7.99996 0.666626C6.54957 0.666626 5.13174 1.09672 3.92578 1.90252C2.71982 2.70831 1.77989 3.85362 1.22485 5.19361C0.669803 6.53361 0.524579 8.00809 0.807537 9.43062C1.0905 10.8531 1.78893 12.1598 2.81451 13.1854C3.8401 14.211 5.14677 14.9094 6.5693 15.1924C7.99183 15.4753 9.46632 15.3301 10.8063 14.7751C12.1463 14.22 13.2916 13.2801 14.0974 12.0741C14.9032 10.8682 15.3333 9.45036 15.3333 7.99996C15.3311 6.05572 14.5578 4.19173 13.183 2.81695C11.8082 1.44216 9.94421 0.668832 7.99996 0.666626ZM7.99996 14C6.81327 14 5.65324 13.6481 4.66654 12.9888C3.67985 12.3295 2.91081 11.3924 2.45669 10.2961C2.00256 9.1997 1.88374 7.9933 2.11525 6.82942C2.34676 5.66553 2.91821 4.59643 3.75732 3.75732C4.59644 2.9182 5.66553 2.34676 6.82942 2.11525C7.99331 1.88374 9.19971 2.00256 10.2961 2.45668C11.3924 2.91081 12.3295 3.67984 12.9888 4.66654C13.6481 5.65323 14 6.81327 14 7.99996C13.9982 9.59072 13.3655 11.1158 12.2407 12.2407C11.1158 13.3655 9.59072 13.9982 7.99996 14Z"
                  fill="#9191A4"
                />
                <path
                  d="M8.66671 7.72396V5.33329C8.66671 5.15648 8.59647 4.98691 8.47145 4.86189C8.34642 4.73686 8.17685 4.66663 8.00004 4.66663C7.82323 4.66663 7.65366 4.73686 7.52864 4.86189C7.40361 4.98691 7.33337 5.15648 7.33337 5.33329V7.99996L7.33404 8.00316C7.3352 8.17876 7.40516 8.3469 7.52891 8.47149L9.41411 10.357C9.47566 10.4205 9.54921 10.4711 9.63049 10.5058C9.71177 10.5406 9.79915 10.5588 9.88755 10.5595C9.97595 10.5602 10.0636 10.5433 10.1454 10.5098C10.2272 10.4762 10.3015 10.4268 10.364 10.3643C10.4265 10.3018 10.476 10.2275 10.5095 10.1457C10.543 10.0639 10.56 9.97621 10.5593 9.88782C10.5586 9.79942 10.5404 9.71203 10.5056 9.63075C10.4709 9.54947 10.4203 9.47591 10.3568 9.41436L8.66671 7.72396Z"
                  fill="#9191A4"
                />
              </g>
              <defs>
                <clipPath id="clip0_0_5234">
                  <rect width="16" height="16" fill="white" />
                </clipPath>
              </defs>
            </svg>
            <p className="font-geistSemiBold text-xs leading-4 text-fontColorPrimary">
              {isDeveloperDataLoading
                ? "..."
                : formatTimeAgo(selectedFunder?.time)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeveloperAddress;
