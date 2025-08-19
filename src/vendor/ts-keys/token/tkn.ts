import * as solana from "@solana/web3.js";
import * as spl from "@solana/spl-token";

export const getAssociatedTokenAccount = (
    wallet: solana.PublicKey,
    mint: solana.PublicKey,
    is2022: boolean
): solana.PublicKey => {
    if (is2022) {
        return solana.PublicKey.findProgramAddressSync(
            [wallet.toBytes(), spl.TOKEN_2022_PROGRAM_ID.toBytes(), mint.toBytes()],
            spl.ASSOCIATED_TOKEN_PROGRAM_ID
        )[0];
    }

    return solana.PublicKey.findProgramAddressSync(
        [wallet.toBytes(), spl.TOKEN_PROGRAM_ID.toBytes(), mint.toBytes()],
        spl.ASSOCIATED_TOKEN_PROGRAM_ID
    )[0];
}
