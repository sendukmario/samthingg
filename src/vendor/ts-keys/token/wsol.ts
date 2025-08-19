import * as solana from "@solana/web3.js";
import * as spl from "@solana/spl-token";
import * as CryptoJS from "crypto-js";
import BN from "bn.js";

export interface createWrappedSolIxParams {
    Payer: solana.PublicKey
    Account: solana.PublicKey
    Seed: string
    ExtraLamports: bigint
}

const DEFAULT_RENT_LAMPORTS = BigInt(2_040_280);
const TOKEN_REQUIRED_SPACE = 165;

export const getWrappedSolAccount = (payer: solana.PublicKey): {
    pubkey: solana.PublicKey;
    seed: string;
} => {
    const seed = spl.NATIVE_MINT.toString().slice(0, 32);
    const buffer = Buffer.concat([
        payer.toBytes(),
        Buffer.from(seed),
        spl.TOKEN_PROGRAM_ID.toBytes(),
    ]);

    // 1. Hash
    const wordArray = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(buffer));

    // 2. Convert to hex string
    const hex = wordArray.toString(CryptoJS.enc.Hex); // 64-char hex

    // 3. Convert to Buffer or Uint8Array
    const hashBuffer = Uint8Array.from(Buffer.from(hex, "hex")); // ✅ 32 bytes

    // 4. Create PublicKey
    const wrappedSolAccount = new solana.PublicKey(hashBuffer);
    // const hash = createHash("sha256").update(buffer).digest();

    return {
        pubkey: wrappedSolAccount,
        seed: seed,
    };
};

export const createWrappedSolInstruction = async (
    params: createWrappedSolIxParams,
): Promise<solana.TransactionInstruction> => {
    const lamports = Number(params.ExtraLamports + DEFAULT_RENT_LAMPORTS);
    if (!Number.isSafeInteger(lamports)) {
        throw new Error("lamports value exceeds safe integer range");
    }

    return solana.SystemProgram.createAccountWithSeed({
        fromPubkey: params.Payer,
        basePubkey: params.Payer,
        newAccountPubkey: params.Account,

        seed: params.Seed,
        lamports: lamports,

        space: TOKEN_REQUIRED_SPACE,
        programId: spl.TOKEN_PROGRAM_ID,
    })
}