export interface SwapInstructionAccount {
  account: string;
  isSigner: boolean;
  isWritable: boolean;
}

export interface SwapInstruction {
  program_id: string;
  accounts: SwapInstructionAccount[];
  data: string;
}

export interface SwapKeysResponse {
  use_wrapped_sol: boolean;
  use_usd: boolean;
  buy_instructions: SwapInstruction[];
  sell_instructions: SwapInstruction[];
  dex_method: number;
}

export interface SwapKeysParams {
  wallet: string;
  mint: string;
}

export interface ComputeBudgetConfig {
  unitLimit?: number;
  microLamports?: bigint;
}

export interface TokenAccountConfig {
  connection: any; // Connection type from @solana/web3.js
  payer: any; // PublicKey type from @solana/web3.js
  seed: string;
  extraLamports?: number;
}

export interface SwapTransactionConfig {
  computeBudget?: ComputeBudgetConfig;
  useWrappedSol?: boolean;
  tokenAccountSeed?: string;
  extraLamports?: number;
}
