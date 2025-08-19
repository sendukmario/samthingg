import * as solana from "@solana/web3.js";
import * as spl from "@solana/spl-token";

import { feeIxsForWithdraw } from "../cu";

export const createWithdrawIx = async(
    from: solana.PublicKey,
    to: solana.PublicKey,
    lamports: number,
): Promise<solana.TransactionInstruction[]> => {
    if (!from) {
        throw new Error("No sender is specified.");
    }

    if (!to) {
        throw new Error("No recipient is specified.");
    }

    if (!lamports) {
        throw new Error("You need to specify an amount.");
    }

    return [
        ...feeIxsForWithdraw(),
        solana.SystemProgram.transfer({
            fromPubkey: from,
            toPubkey: to,
            lamports,
        }),
    ]
}