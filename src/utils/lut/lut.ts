import * as solana from "@solana/web3.js";

export const JUP_LUT_ADDRESS = new solana.PublicKey('24qzte7cXrnEtUNctKdCwBVFj6N8Thaj3Nh1LRguagM6')

/* Run this once at startup, and save the response in a global variable */
export const getLUT = async (
    connection: solana.Connection,
    lutPubkey: solana.PublicKey,
) => {
    const result = await connection.getAddressLookupTable(
        lutPubkey,
        {
            commitment: "confirmed",
        },
    )

    if (!result || !result.value) {
        return null;
    }

    return result.value;
}
