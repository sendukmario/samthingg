import * as solana from "@solana/web3.js"

const JITO_NO_FRONT = new solana.PublicKey(
    "jitodontfront111111111111111111111111111123"
);

export const computePriorityFee = (cuLimit: number, priorityFee: number): (solana.TransactionInstruction[]) => {
    const priorityFeeLamports = priorityFee * solana.LAMPORTS_PER_SOL
    const pricePerUnitLamports = priorityFeeLamports / cuLimit

    const microLamports = pricePerUnitLamports * 1e6;
    const ixs= [
        solana.ComputeBudgetProgram.setComputeUnitLimit({
            units: cuLimit,
        }),

        solana.ComputeBudgetProgram.setComputeUnitPrice({
            microLamports: Math.ceil(microLamports),
        }),
    ]

    const keys: solana.AccountMeta[] = [{
        pubkey: JITO_NO_FRONT, isSigner: false, isWritable: false,
    }]

    ixs.map((ix) => {
        return ix.keys = keys
    })

    return ixs
}

export const feeIxsForWithdraw = () => {
    return [
        solana.ComputeBudgetProgram.setComputeUnitLimit({ units: 1_000 }),
        solana.ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 1_000_000 }),
    ];
}