import * as solana from "@solana/web3.js";
import bs58 from 'bs58';

import { Token, SwapRequest, NovaProgram } from "./types";

import { afterIxs, beforeIxs, createNovaIx, createWithdrawIx } from "./instructions";
import { getSwapAccounts } from "./helpers";

const NovaLookupTableAccount = new solana.PublicKey("24qzte7cXrnEtUNctKdCwBVFj6N8Thaj3Nh1LRguagM6");

export const getConnections = (): solana.Connection[] => {
  return [
    new solana.Connection("https://enrika-d7fmke-fast-mainnet.helius-rpc.com/"),
    new solana.Connection("https://trish-eqo75x-fast-mainnet.helius-rpc.com"),
    new solana.Connection("https://mainnet.helius-rpc.com/?api-key=0f803376-0189-4d72-95f6-a5f41cef157d")
  ];
};

export const handleSwap = async (
  connections: solana.Connection[],
  token: Token,
  request: SwapRequest,
  lutAccount: solana.AddressLookupTableAccount | null = null,
  blockhash: string
) => {
  let response = await beforeIxs(token, request);
  let instructions = response.instructions;

  const swapIx = new solana.TransactionInstruction({
    programId: NovaProgram,
    keys: getSwapAccounts(token, request),
    data: createNovaIx(token, request),
  })

  instructions = [...instructions, swapIx, ...await afterIxs(token, request)];

  const finalLutAccount = (Boolean(lutAccount) ? lutAccount : (await connections[0].getAddressLookupTable(NovaLookupTableAccount)).value)

  const finalBlockhash = Boolean(blockhash) ? blockhash : (await connections[0].getLatestBlockhash("processed")).blockhash
  const message = new solana.TransactionMessage({
    payerKey: request.Wallet.publicKey,
    recentBlockhash: finalBlockhash,
    instructions: instructions,
  }).compileToV0Message([finalLutAccount!]);

  const tx = new solana.VersionedTransaction(message);
  tx.sign([request.Wallet]);

  // Send transaction to all connections concurrently
  const sendPromises = connections.map(async (connection) => {
    return await connection.sendTransaction(tx, { skipPreflight: true });
  });

  const signatures = await Promise.all(sendPromises);

  const serializedTx = tx.serialize();
  const base64tx = Buffer.from(serializedTx).toString("base64");
  const signature = bs58.encode(tx.signatures[0]);

  console.warn("💵💵 Txs:", {
    message
  });
  console.warn(`💵💵 https://solscan.io/tx/${signature}`);

  return {
    signature: bs58.encode(tx.signatures[0]),
    base64tx,
    signatures
  }
}

export const handleWithdraw = async (
  connection: solana.Connection,
  blockhash: solana.Blockhash,

  signer: solana.Keypair,
  to: solana.PublicKey,

  amount?: number,
  max?: boolean,
) => {
  if (!amount && !max) {
    throw new Error("You need to specify an amount.");
  }

  let lamports: number = 0;

  if (max) {
    const balance = await connection.getBalance(signer.publicKey, { commitment: "processed" })
    lamports = balance - 6_000;
  } else if (amount) {
    lamports = amount * solana.LAMPORTS_PER_SOL;
  }

  if (lamports == 0) {
    throw new Error("Invalid amount.");
  }

  const withdrawIxs = await createWithdrawIx(
    signer.publicKey,
    to,
    lamports,
  );

  const finalBlockhash = typeof blockhash === 'string' ? blockhash : (await connection.getLatestBlockhash("processed")).blockhash;

  const messageV0 = new solana.TransactionMessage({
    payerKey: signer.publicKey,
    recentBlockhash: finalBlockhash,
    instructions: withdrawIxs,
  }).compileToV0Message();

  const tx = new solana.VersionedTransaction(messageV0);
  tx.sign([signer]);

  const signature = await connection.sendTransaction(tx, { skipPreflight: true });
  const serializedTx = tx.serialize();
  const base64tx = Buffer.from(serializedTx).toString("base64");
  // const signature = bs58.encode(tx.signatures[0]);

  console.warn(`💵💵 https://solscan.io/tx/${signature}`);

  return {
    signature: bs58.encode(tx.signatures[0]),
    base64tx,
  }
}
