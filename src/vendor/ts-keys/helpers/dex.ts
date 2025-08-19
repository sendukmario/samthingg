import * as solana from "@solana/web3.js";

import { SwapRequest, Token } from "../types";

import {
    getBoopAccounts,
    getLaunchLabAccounts,
    getMeteoraAmmAccounts,
    getMeteoraAmmV2Accounts,
    getMeteoraCurveAccounts,
    getMeteoraDlmmAccounts, getMoonItAccounts,
    getPumpFunAccounts,
    getPumpSwapAccounts,
    getRaydiumAmmAccounts,
    getRaydiumClmmAccounts,
    getRaydiumCpmmAccounts
} from "../platforms";

export const getSwapAccounts = (
    token: Token,
    request: SwapRequest
): solana.AccountMeta[] => {
    const dex = token.dex;
    switch (dex) {
        case "PumpFun":
            return getPumpFunAccounts(request, token);

        case "PumpSwap":
            return getPumpSwapAccounts(request, token);

        case "Raydium AMM":
            return getRaydiumAmmAccounts(request, token);

        case "Raydium CLMM":
            return getRaydiumClmmAccounts(request, token);

        case "Raydium CPMM":
            return getRaydiumCpmmAccounts(request, token);

        case "LaunchLab":
            return getLaunchLabAccounts(request, token);

        case "Meteora DLMM":
            return getMeteoraDlmmAccounts(request, token);

        case "Meteora AMM":
            return getMeteoraAmmAccounts(request, token);

        case "Meteora AMM V2":
            return getMeteoraAmmV2Accounts(request, token);

        case "Dynamic Bonding Curve":
        case "Virtual Curve":
            return getMeteoraCurveAccounts(request, token);

        case "Boop":
            return getBoopAccounts(request, token);

        case "MoonIt":
            return getMoonItAccounts(request, token);

        default:
            throw new Error(`Unsupported DEX: ${dex}`);
    }
}

export const getMethod = (dex: string): number => {
    switch (dex) {
        case "PumpFun":
            return 1

        case "Raydium AMM":
            return 2

        case "Meteora DLMM":
            return 3

        case "Meteora AMM":
            return 4

        case "MoonIt":
            return 5

        case "Raydium CLMM":
            return 6

        case "PumpSwap":
            return 7

        case "LaunchLab":
            return 8

        case "Meteora AMM V2":
            return 9

        case "Dynamic Bonding Curve":
        case "Virtual Curve":
            return 10

        case "Boop":
            return 11

        case "Raydium CPMM":
            return 12

        default:
            return 0
    }
}

export const computeUnitMap: Record<string, number> = {
    "PumpFun":              140_000,
    "PumpSwap":             170_000,

    "LaunchLab":             120_000,
    "Raydium AMM":           105_000,
    "Raydium CLMM":          200_000,
    "Raydium CPMM":          105_000,

    "Meteora AMM":           200_000,
    "Meteora AMM V2":        200_000,
    "Meteora DLMM":          200_000,
    "Virtual Curve":         200_000,
    "Dynamic Bonding Curve": 200_000,

    "MoonIt":                130_000,
    "Boop":                  200_000,
}