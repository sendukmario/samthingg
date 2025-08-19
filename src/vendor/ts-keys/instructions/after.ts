import * as solana from "@solana/web3.js";
import * as spl from "@solana/spl-token";

import { SwapRequest, Token } from "../types";

import {
    getWrappedSolAccount,
    USDC_MINT,
} from "../token";

export const afterIxs = async (
    token: Token,
    request: SwapRequest,
): Promise<solana.TransactionInstruction[]> => {
    let instructions: solana.TransactionInstruction[] = [];

    if (token.is_wrapped_sol) {
        const ata = getWrappedSolAccount(request.Wallet.publicKey);
        const closeWsolIx = spl.createCloseAccountInstruction(
            ata.pubkey,
            request.Wallet.publicKey,
            request.Wallet.publicKey,
            [],
            spl.TOKEN_PROGRAM_ID,
        );

        instructions = [closeWsolIx]
    }

    if (token.is_usdc) {
        const associatedUsdcAccount = solana.PublicKey.findProgramAddressSync([
            request.Wallet.publicKey.toBytes(),
            spl.TOKEN_PROGRAM_ID.toBytes(),
            USDC_MINT.toBytes(),
        ], spl.ASSOCIATED_TOKEN_PROGRAM_ID)[0];

        const closeUsdcIx = spl.createCloseAccountInstruction(
            associatedUsdcAccount,
            request.Wallet.publicKey,
            request.Wallet.publicKey,
            [],
            spl.TOKEN_PROGRAM_ID,
        );

        instructions = [
            ...instructions,
            closeUsdcIx,
        ]
    }

    return instructions;
}