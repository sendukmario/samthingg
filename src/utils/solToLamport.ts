import { LAMPORTS_PER_SOL } from "@solana/web3.js";

export function solToLamports(solAmount: number): bigint {
    // Multiply by 1e9 and round to nearest integer
    return BigInt(Math.round(solAmount * LAMPORTS_PER_SOL));
}

export function lamportsToSol(lamports: bigint): number {
    return Number(lamports) / LAMPORTS_PER_SOL;
}