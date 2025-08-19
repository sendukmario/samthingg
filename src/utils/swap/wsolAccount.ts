import * as solana from "@solana/web3.js";
import * as spl from "@solana/spl-token";
// import { createHash } from "crypto";
import CryptoJS from "crypto-js";
import { createHash } from "crypto";

export interface CreateWsolIx {
    Payer: solana.PublicKey;
    Account: solana.PublicKey;
    Seed: string;
    ExtraLamports: number;
}

const DEFAULT_RENT_LAMPORTS = 2_039_280;
const TOKEN_REQUIRED_SPACE = 165;

export const getWsolAccount = (payer: solana.PublicKey): {
    pubkey: solana.PublicKey
    seed: string
} => {
    const seed= spl.NATIVE_MINT.toString().slice(0, 32);
    const buffer = Buffer.concat([
        payer.toBytes(),
        Buffer.from(seed),
        spl.TOKEN_PROGRAM_ID.toBytes(),
    ]);

    // const hash = createHash("sha256").update(buffer).digest()
    const hash = CryptoJS.SHA256(CryptoJS.lib.WordArray.create(buffer)).toString(CryptoJS.enc.Hex);
    const wsolAccount = new solana.PublicKey(hash)

    return {
        pubkey: wsolAccount,
        seed: seed,
    }
}

export const createWsolInstruction = async (params: CreateWsolIx): Promise<solana.TransactionInstruction> => {
    const lamports = DEFAULT_RENT_LAMPORTS + params.ExtraLamports;
    const ix = solana.SystemProgram.createAccountWithSeed({
        fromPubkey: params.Payer,
        basePubkey: params.Payer,
        newAccountPubkey: params.Account,
        seed: params.Seed,
        lamports: lamports,
        space: TOKEN_REQUIRED_SPACE,
        programId: spl.TOKEN_PROGRAM_ID,
    });
    return ix;
};
