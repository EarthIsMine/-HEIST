import { Transaction, SystemProgram, PublicKey } from '@solana/web3.js';
import { ENTRY_FEE_LAMPORTS } from '@heist/shared';

export function buildEntryFeeTx(payerPubkey: PublicKey, escrowPubkey: PublicKey): Transaction {
  return new Transaction().add(
    SystemProgram.transfer({
      fromPubkey: payerPubkey,
      toPubkey: escrowPubkey,
      lamports: ENTRY_FEE_LAMPORTS,
    }),
  );
}
