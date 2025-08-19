import * as solana from "@solana/web3.js";
import * as spl from "@solana/spl-token";

import { SwapRequest, Token } from "../types";

import {
    createWrappedSolInstruction,
    getAssociatedTokenAccount,
    getWrappedSolAccount,
    USDC_MINT,
} from "../token";

import { computePriorityFee } from "../cu";
import { computeUnitMap } from "../helpers";

export const beforeIxs = async (
    token: Token,
    request: SwapRequest,
): Promise<{
    wrappedSolAccount: solana.PublicKey | undefined;
    usdcAccount: solana.PublicKey | undefined;
    tokenAccount: solana.PublicKey | undefined;
    instructions: solana.TransactionInstruction[]
}> => {
    let CUs = computeUnitMap[token.dex];
    if (token.is_usdc) {
        CUs += 20_000;
    }

    // Initializes the instructions with the compute units / priority fee.
    const priorityIxs = computePriorityFee(CUs, request.Fee)
    let instructions: solana.TransactionInstruction[] = [
        ...priorityIxs,
    ]

    let wrappedSolAccount: solana.PublicKey | undefined;
    let usdcAccount: solana.PublicKey | undefined;
    let tokenAccount: solana.PublicKey | undefined;

    if (token.is_usdc) {
        usdcAccount = solana.PublicKey.findProgramAddressSync([
            request.Wallet.publicKey.toBytes(),
            spl.TOKEN_PROGRAM_ID.toBytes(),
            USDC_MINT.toBytes(),
        ], spl.ASSOCIATED_TOKEN_PROGRAM_ID)[0];

        const createUsdcIx = spl.createAssociatedTokenAccountIdempotentInstruction(
            request.Wallet.publicKey,
            usdcAccount,
            request.Wallet.publicKey,
            USDC_MINT,
        );

        instructions = [
            ...instructions,
            createUsdcIx,
        ];
    }

    if (token.is_wrapped_sol) {
        let ataResp = getWrappedSolAccount(request.Wallet.publicKey);
        wrappedSolAccount = ataResp.pubkey;

        const createWsolIx = await createWrappedSolInstruction({
            Payer: request.Wallet.publicKey,
            Account: ataResp.pubkey,
            Seed: ataResp.seed,
            ExtraLamports: request.IsBuy ? request.Amount : BigInt(0),
        });

        const initWsolIx = spl.createInitializeAccountInstruction(
            ataResp.pubkey,
            spl.NATIVE_MINT,
            request.Wallet.publicKey,
            spl.TOKEN_PROGRAM_ID,
        );

        instructions = [
            ...instructions,
            createWsolIx,
            initWsolIx,
        ];
    }

    if (request.IsBuy) {
        const mint = new solana.PublicKey(token.mint);
        const programId = token.is_2022 ? spl.TOKEN_2022_PROGRAM_ID : spl.TOKEN_PROGRAM_ID;

        tokenAccount = getAssociatedTokenAccount(
            request.Wallet.publicKey,
            mint,
            token.is_2022,
        );

        const mintIx = spl.createAssociatedTokenAccountIdempotentInstruction(
            request.Wallet.publicKey,
            tokenAccount,
            request.Wallet.publicKey,
            mint,
            programId,
        );

        instructions.push(mintIx)
    }

    return {
        wrappedSolAccount,
        usdcAccount,
        tokenAccount,
        instructions
    };
}