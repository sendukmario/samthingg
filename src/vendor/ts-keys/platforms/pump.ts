import * as solana from "@solana/web3.js";

/**
 * Gets the user volume accumulator PDA for a given address
 */
export const getUserVolumeAccumulator = (
    address: solana.PublicKey,
    program: solana.PublicKey,
): solana.PublicKey => {
    const [accumulator] = solana.PublicKey.findProgramAddressSync(
        [
            Buffer.from("user_volume_accumulator"),
            address.toBytes(),
        ],
        program,
    );

    return accumulator;
};