import { cn } from "@/libraries/utils";
import Image from "next/image";
import React from "react";
import { CachedImage } from "./CachedImage";

const SortButton = ({
  type = "usdc-or-sol",
  value,
  setValue,
}: {
  type?: "usdc-or-sol";
  value: string;
  setValue: (value: "USDC" | "SOL") => void;
}) => {
  return (
    <>
      <div className="flex h-[20px] w-auto items-center justify-center rounded-[10px] bg-secondary p-[3px]">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setValue("USDC");
          }}
          className={cn(
            "flex size-[16px] cursor-pointer items-center justify-center rounded-full p-1 duration-300",
            value === "USDC" && "bg-white/10 text-fontColorPrimary",
          )}
        >
          <div className="relative flex aspect-square size-[12px] flex-shrink-0 items-center justify-center">
            <Image
              src={
                value === "USDC" ? "/icons/usdc.svg" : "/icons/usdc-gray.svg"
              }
              alt="USDC Icon"
              fill
              quality={100}
            />
          </div>
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setValue("SOL");
          }}
          className={cn(
            "flex size-[16px] cursor-pointer items-center justify-center rounded-full p-1 duration-300",
            value === "SOL" && "bg-white/10 text-fontColorPrimary",
          )}
        >
          <div className="relative flex aspect-square size-[12px] flex-shrink-0 items-center justify-center">
            <CachedImage
              src="/icons/solana-sq.svg"
              alt="Solana Icon"
              fill
              quality={100}
            />
          </div>
        </button>
      </div>
    </>
  );
};

export default SortButton;

export const SortCoinButton = ({
  value,
  setValue,
  tokenImage,
  isTokenAmount = false,
}: {
  value: "COIN" | "SOL";
  setValue: (value: "COIN" | "SOL") => void;
  tokenImage?: string;
  isTokenAmount?: boolean;
}) => {
  return (
    <>
      <div className="flex h-[20px] w-auto items-center justify-center rounded-[10px] bg-secondary p-[3px]">
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setValue("COIN");
          }}
          className={cn(
            "flex size-[16px] cursor-pointer items-center justify-center rounded-full p-1 duration-300",
            value === "COIN" && "bg-white/10 text-fontColorPrimary",
          )}
        >
          <div
            className={cn(
              "relative flex aspect-square size-[12px] flex-shrink-0 items-center justify-center",
              value !== "COIN"
                ? "grayscale"
                : isTokenAmount
                  ? "brightness-200"
                  : "grayscale",
            )}
          >
            <Image
              src={
                isTokenAmount
                  ? "/icons/token.svg"
                  : tokenImage
                    ? tokenImage
                    : value === "COIN"
                      ? "/icons/usdc.svg"
                      : "/icons/usdc-gray.svg"
              }
              alt="Coin Symbol"
              fill
              quality={100}
              className={cn("rounded-full")}
            />
          </div>
        </button>
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setValue("SOL");
          }}
          className={cn(
            "flex size-[16px] cursor-pointer items-center justify-center rounded-full p-1 duration-300",
            value === "SOL" && "bg-white/10 text-fontColorPrimary",
          )}
        >
          <div className="relative flex aspect-square size-[12px] flex-shrink-0 items-center justify-center">
            <CachedImage
              src="/icons/solana-sq.svg"
              alt="Solana Icon"
              fill
              quality={100}
            />
          </div>
        </button>
      </div>
    </>
  );
};

export const ToggleSortButton = ({
  value,
  setValue,
}: {
  value: "USDC" | "SOL";
  setValue: (value: "USDC" | "SOL") => void;
}) => {
  const toggleValue = () => {
    setValue(value === "USDC" ? "SOL" : "USDC");
  };

  return (
    <div className="flex h-[20px] w-auto items-center justify-center rounded-[10px] bg-secondary p-[3px]">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleValue();
        }}
        className={cn(
          "flex size-[16px] cursor-pointer items-center justify-center rounded-full p-1 duration-300",
          "bg-white/10 text-fontColorPrimary",
        )}
      >
        <div className="relative flex aspect-square size-[12px] flex-shrink-0 items-center justify-center">
          {value === "USDC" ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 10 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.00098 4.50001C8.8787 3.62011 8.47051 2.80484 7.8393 2.17975C7.20808 1.55467 6.38885 1.15446 5.50781 1.04078C4.62677 0.927099 3.73279 1.10625 2.96358 1.55063C2.19437 1.99501 1.5926 2.67997 1.25098 3.50001M1.00098 5.5C1.12326 6.37989 1.53144 7.19517 2.16266 7.82025C2.79387 8.44533 3.6131 8.84554 4.49414 8.95922C5.37518 9.07291 6.26917 8.89376 7.03838 8.44938C7.80759 8.005 8.40935 7.32003 8.75098 6.5M1.00098 2.50001V3.50001H2.00098M8.00098 6.5H9.00098V7.5"
                stroke="#FCFCFD"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M6.40025 3.87503C6.21575 3.63503 5.86925 3.49053 5.50025 3.50003H4.49975C3.94775 3.50003 3.5 3.83503 3.5 4.25003C3.5 4.66353 3.94775 4.99953 4.49975 4.99953H5.50025C6.05225 4.99953 6.5 5.33503 6.5 5.74953C6.5 6.16353 6.05225 6.49903 5.50025 6.49903H4.49975C4.13075 6.50853 3.78425 6.36403 3.59975 6.12403M5 2.50002V3.50002M5 6.50002V7.50002"
                stroke="#FCFCFD"
                strokeWidth="1.00078"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 10 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.00098 4.50001C8.8787 3.62011 8.47051 2.80484 7.8393 2.17975C7.20808 1.55467 6.38885 1.15446 5.50781 1.04078C4.62677 0.927099 3.73279 1.10625 2.96358 1.55063C2.19437 1.99501 1.5926 2.67997 1.25098 3.50001M1.00098 5.5C1.12326 6.37989 1.53144 7.19517 2.16266 7.82025C2.79387 8.44533 3.6131 8.84554 4.49414 8.95922C5.37518 9.07291 6.26917 8.89376 7.03838 8.44938C7.80759 8.005 8.40935 7.32003 8.75098 6.5M1.00098 2.50001V3.50001H2.00098M8.00098 6.5H9.00098V7.5"
                stroke="#FCFCFD"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.65254 5.90176C3.67666 5.87539 3.70982 5.86 3.74499 5.86H6.93456C6.99284 5.86 7.02198 5.93693 6.98078 5.98199L6.35071 6.67106C6.32659 6.69744 6.29343 6.71282 6.25826 6.71282H3.0687C3.01041 6.71282 2.98127 6.63589 3.02247 6.59083L3.65254 5.90176Z"
                fill="url(#paint0_linear_0_1)"
              />
              <path
                d="M3.65254 3.32899C3.67767 3.30261 3.71083 3.28722 3.74499 3.28722H6.93456C6.99284 3.28722 7.02198 3.36415 6.98078 3.40921L6.35071 4.09828C6.32659 4.12466 6.29343 4.14004 6.25826 4.14004H3.0687C3.01041 4.14004 2.98127 4.06311 3.02247 4.01806L3.65254 3.32899Z"
                fill="url(#paint1_linear_0_1)"
              />
              <path
                d="M6.35071 4.60719C6.32659 4.58082 6.29343 4.56543 6.25826 4.56543H3.0687C3.01041 4.56543 2.98127 4.64236 3.02247 4.68742L3.65254 5.37649C3.67666 5.40286 3.70982 5.41825 3.74499 5.41825H6.93456C6.99284 5.41825 7.02198 5.34132 6.98078 5.29626L6.35071 4.60719Z"
                fill="url(#paint2_linear_0_1)"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_0_1"
                  x1="6.62986"
                  y1="2.87562"
                  x2="4.09609"
                  y2="7.3133"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#00FFA3" />
                  <stop offset="1" stopColor="#DC1FFF" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear_0_1"
                  x1="5.66465"
                  y1="2.32449"
                  x2="3.13088"
                  y2="6.76217"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#00FFA3" />
                  <stop offset="1" stopColor="#DC1FFF" />
                </linearGradient>
                <linearGradient
                  id="paint2_linear_0_1"
                  x1="6.14418"
                  y1="2.59836"
                  x2="3.61041"
                  y2="7.03604"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#00FFA3" />
                  <stop offset="1" stopColor="#DC1FFF" />
                </linearGradient>
              </defs>
            </svg>
          )}
        </div>
      </button>
    </div>
  );
};

export const ToggleTokenSolButton = ({
  value,
  setValue,
  tokenImage,
}: {
  value: "token" | "market_cap";
  setValue: (value: "token" | "market_cap") => void;
  tokenImage?: string;
}) => {
  const toggleValue = () => {
    setValue(value === "token" ? "market_cap" : "token");
  };

  return (
    <div className="flex h-[20px] w-auto items-center justify-center rounded-[10px] bg-secondary p-[3px]">
      <button
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          toggleValue();
        }}
        className={cn(
          "flex size-[16px] cursor-pointer items-center justify-center rounded-full p-1 duration-300",
          "bg-white/10 text-fontColorPrimary",
        )}
      >
        <div className="relative flex aspect-square size-[12px] flex-shrink-0 items-center justify-center">
          {value === "token" ? (
            <svg
              width="14"
              height="14"
              viewBox="0 0 10 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.00098 4.50001C8.8787 3.62011 8.47051 2.80484 7.8393 2.17975C7.20808 1.55467 6.38885 1.15446 5.50781 1.04078C4.62677 0.927099 3.73279 1.10625 2.96358 1.55063C2.19437 1.99501 1.5926 2.67997 1.25098 3.50001M1.00098 5.5C1.12326 6.37989 1.53144 7.19517 2.16266 7.82025C2.79387 8.44533 3.6131 8.84554 4.49414 8.95922C5.37518 9.07291 6.26917 8.89376 7.03838 8.44938C7.80759 8.005 8.40935 7.32003 8.75098 6.5M1.00098 2.50001V3.50001H2.00098M8.00098 6.5H9.00098V7.5"
                stroke="#FCFCFD"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M5.00098 2.7998C6.216 2.7998 7.20117 3.78497 7.20117 5C7.20117 6.21503 6.216 7.2002 5.00098 7.2002C3.78595 7.2002 2.80078 6.21503 2.80078 5C2.80078 3.78497 3.78595 2.7998 5.00098 2.7998ZM5 3C6.10457 3 7 3.89543 7 5C7 6.10457 6.10457 6.99902 5 6.99902L5.00098 7C6.10555 7 7.00098 6.10457 7.00098 5C7.00098 3.89543 6.10555 3 5.00098 3H5ZM4.81641 6.58789C4.87671 6.59479 4.93785 6.59961 5 6.59961V6.59863L4.83691 6.5918C4.83 6.59109 4.82329 6.58868 4.81641 6.58789ZM5.00098 3.59961C4.22778 3.59961 3.60059 4.2268 3.60059 5C3.60059 5.7732 4.22778 6.40039 5.00098 6.40039C5.77418 6.40039 6.40137 5.7732 6.40137 5C6.40137 4.2268 5.77418 3.59961 5.00098 3.59961ZM4.79883 4.17969C4.921 4.0988 5.08096 4.0988 5.20312 4.17969L5.25977 4.22656L5.73145 4.69824L5.77832 4.75488C5.85922 4.87706 5.8592 5.03702 5.77832 5.15918L5.73145 5.21582L5.25977 5.6875C5.13435 5.81276 4.94112 5.8286 4.79883 5.73438L4.74219 5.6875L4.27051 5.21582C4.12757 5.07269 4.12752 4.84141 4.27051 4.69824L4.74219 4.22656L4.79883 4.17969ZM5.58887 5.0752L5.11816 5.5459C5.08662 5.57744 5.04523 5.59278 5.00391 5.59375C5.02419 5.59344 5.04443 5.5907 5.06348 5.58301L5.11914 5.5459L5.58984 5.0752C5.60519 5.05984 5.61488 5.0413 5.62305 5.02246C5.61494 5.04128 5.60424 5.05982 5.58887 5.0752ZM4.95117 5.58496C4.9644 5.58917 4.97748 5.59193 4.99121 5.59277C4.97745 5.59204 4.96445 5.58909 4.95117 5.58496ZM4.89258 5.55273C4.90391 5.56258 4.9157 5.57084 4.92871 5.57715C4.91564 5.57088 4.90399 5.56261 4.89258 5.55273ZM3.46289 5.44238C3.43711 5.35259 3.41891 5.25958 3.40918 5.16406L3.40137 5C3.40137 4.11667 4.11679 3.40092 5 3.40039L4.83594 3.4082C4.02935 3.49034 3.40039 4.17173 3.40039 5C3.40039 5.15355 3.42251 5.30182 3.46289 5.44238ZM5.11816 4.36816L5.58887 4.83887C5.63513 4.88513 5.64744 4.95169 5.62793 5.00977C5.64069 4.97207 5.64186 4.93147 5.62695 4.89453L5.58984 4.83887L5.11914 4.36816C5.10281 4.35184 5.08368 4.34017 5.06348 4.33203L5.11816 4.36816Z"
                fill="#FCFCFD"
              />
            </svg>
          ) : (
            <svg
              width="14"
              height="14"
              viewBox="0 0 10 10"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M9.00098 4.50001C8.8787 3.62011 8.47051 2.80484 7.8393 2.17975C7.20808 1.55467 6.38885 1.15446 5.50781 1.04078C4.62677 0.927099 3.73279 1.10625 2.96358 1.55063C2.19437 1.99501 1.5926 2.67997 1.25098 3.50001M1.00098 5.5C1.12326 6.37989 1.53144 7.19517 2.16266 7.82025C2.79387 8.44533 3.6131 8.84554 4.49414 8.95922C5.37518 9.07291 6.26917 8.89376 7.03838 8.44938C7.80759 8.005 8.40935 7.32003 8.75098 6.5M1.00098 2.50001V3.50001H2.00098M8.00098 6.5H9.00098V7.5"
                stroke="#FCFCFD"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <path
                d="M3.65254 5.90176C3.67666 5.87539 3.70982 5.86 3.74499 5.86H6.93456C6.99284 5.86 7.02198 5.93693 6.98078 5.98199L6.35071 6.67106C6.32659 6.69744 6.29343 6.71282 6.25826 6.71282H3.0687C3.01041 6.71282 2.98127 6.63589 3.02247 6.59083L3.65254 5.90176Z"
                fill="url(#paint0_linear_0_1)"
              />
              <path
                d="M3.65254 3.32899C3.67767 3.30261 3.71083 3.28722 3.74499 3.28722H6.93456C6.99284 3.28722 7.02198 3.36415 6.98078 3.40921L6.35071 4.09828C6.32659 4.12466 6.29343 4.14004 6.25826 4.14004H3.0687C3.01041 4.14004 2.98127 4.06311 3.02247 4.01806L3.65254 3.32899Z"
                fill="url(#paint1_linear_0_1)"
              />
              <path
                d="M6.35071 4.60719C6.32659 4.58082 6.29343 4.56543 6.25826 4.56543H3.0687C3.01041 4.56543 2.98127 4.64236 3.02247 4.68742L3.65254 5.37649C3.67666 5.40286 3.70982 5.41825 3.74499 5.41825H6.93456C6.99284 5.41825 7.02198 5.34132 6.98078 5.29626L6.35071 4.60719Z"
                fill="url(#paint2_linear_0_1)"
              />
              <defs>
                <linearGradient
                  id="paint0_linear_0_1"
                  x1="6.62986"
                  y1="2.87562"
                  x2="4.09609"
                  y2="7.3133"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#00FFA3" />
                  <stop offset="1" stopColor="#DC1FFF" />
                </linearGradient>
                <linearGradient
                  id="paint1_linear_0_1"
                  x1="5.66465"
                  y1="2.32449"
                  x2="3.13088"
                  y2="6.76217"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#00FFA3" />
                  <stop offset="1" stopColor="#DC1FFF" />
                </linearGradient>
                <linearGradient
                  id="paint2_linear_0_1"
                  x1="6.14418"
                  y1="2.59836"
                  x2="3.61041"
                  y2="7.03604"
                  gradientUnits="userSpaceOnUse"
                >
                  <stop stopColor="#00FFA3" />
                  <stop offset="1" stopColor="#DC1FFF" />
                </linearGradient>
              </defs>
            </svg>
          )}
        </div>
      </button>
    </div>
  );
};
