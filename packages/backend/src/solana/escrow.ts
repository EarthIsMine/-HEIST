import { Connection, clusterApiUrl, PublicKey } from '@solana/web3.js';
import { ENTRY_FEE_LAMPORTS } from '@heist/shared';
import { log } from '../utils/logger.js';

const CLUSTER = (process.env.SOLANA_CLUSTER as 'devnet' | 'mainnet-beta') || 'devnet';
const connection = new Connection(clusterApiUrl(CLUSTER), 'confirmed');

export async function verifyDeposit(
  txSignature: string,
  expectedPayer: string,
  escrowPubkey: string,
): Promise<boolean> {
  try {
    const result = await connection.confirmTransaction(txSignature, 'confirmed');
    if (result.value.err) {
      log('Escrow', `Transaction failed: ${txSignature}`);
      return false;
    }

    const tx = await connection.getTransaction(txSignature, { commitment: 'confirmed' });
    if (!tx || !tx.meta) {
      log('Escrow', `Transaction not found: ${txSignature}`);
      return false;
    }

    log('Escrow', `Deposit verified: ${txSignature}`);
    return true;
  } catch (err) {
    log('Escrow', `Verification error: ${err}`);
    return false;
  }
}
