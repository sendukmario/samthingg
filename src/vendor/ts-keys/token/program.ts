import * as solana from "@solana/web3.js";
import * as spl from "@solana/spl-token";

/**
 * Determines the appropriate token program IDs for base and quote tokens
 */
export const getProgramId = (
    baseMint: solana.PublicKey,
    quoteMint: solana.PublicKey,
    mint: solana.PublicKey,
    is2022: boolean,
): [solana.PublicKey, solana.PublicKey] => {
    let baseProgram = spl.TOKEN_PROGRAM_ID;
    let quoteProgram = spl.TOKEN_PROGRAM_ID;

    if (baseMint.equals(mint) && is2022) {
        baseProgram = spl.TOKEN_2022_PROGRAM_ID;
    }
    if (quoteMint.equals(mint) && is2022) {
        quoteProgram = spl.TOKEN_2022_PROGRAM_ID;
    }

    return [baseProgram, quoteProgram];
};

export const getTokenProgramId = (
    is2022: boolean
): solana.PublicKey => {
    return is2022 ? spl.TOKEN_2022_PROGRAM_ID : spl.TOKEN_PROGRAM_ID;
}