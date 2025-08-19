interface InstructionAccount {
  account: string;
  isSigner: boolean;
  isWritable: boolean;
}

interface Instruction {
  program_id: string;
  accounts: InstructionAccount[];
  data: string;
}

export interface SwapKeys {
  use_wrapped_sol: boolean;
  buy_instructions: Instruction[];
  sell_instructions: Instruction[];
}
