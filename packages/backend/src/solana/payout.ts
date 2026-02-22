import {
  Connection,
  clusterApiUrl,
  Keypair,
  PublicKey,
  Transaction,
  SystemProgram,
  sendAndConfirmTransaction,
} from '@solana/web3.js';
import { log } from '../utils/logger.js';

const CLUSTER = (process.env.SOLANA_CLUSTER as 'devnet' | 'mainnet-beta') || 'devnet';
const connection = new Connection(clusterApiUrl(CLUSTER), 'confirmed');

function getEscrowKeypair(): Keypair | null {
  const secretKey = process.env.ESCROW_SECRET_KEY;
  if (!secretKey) {
    log('Payout', 'No ESCROW_SECRET_KEY set - payouts disabled');
    return null;
  }
  try {
    const bytes = JSON.parse(secretKey) as number[];
    return Keypair.fromSecretKey(Uint8Array.from(bytes));
  } catch {
    log('Payout', 'Invalid ESCROW_SECRET_KEY format');
    return null;
  }
}

export async function distributePayouts(
  winners: { walletAddress: string }[],
  amountPerWinner: number,
): Promise<string[]> {
  const escrow = getEscrowKeypair();
  if (!escrow) {
    log('Payout', 'Skipping payouts (no escrow key)');
    return [];
  }

  const signatures: string[] = [];

  for (const winner of winners) {
    try {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: escrow.publicKey,
          toPubkey: new PublicKey(winner.walletAddress),
          lamports: amountPerWinner,
        }),
      );

      const sig = await sendAndConfirmTransaction(connection, tx, [escrow]);
      signatures.push(sig);
      log('Payout', `Sent ${amountPerWinner} lamports to ${winner.walletAddress}: ${sig}`);
    } catch (err) {
      log('Payout', `Failed payout to ${winner.walletAddress}: ${err}`);
      signatures.push('FAILED');
    }
  }

  return signatures;
}

/** Refund all players when game ends abnormally (disconnect, error, etc.) */
export async function refundAllPlayers(
  players: { walletAddress: string }[],
  amountPerPlayer: number,
): Promise<string[]> {
  if (amountPerPlayer <= 0) {
    log('Refund', 'No entry fee to refund');
    return [];
  }

  const escrow = getEscrowKeypair();
  if (!escrow) {
    log('Refund', 'Skipping refunds (no escrow key)');
    return [];
  }

  const realPlayers = players.filter((p) => p.walletAddress !== 'bot');
  log('Refund', `Refunding ${realPlayers.length} players (${amountPerPlayer} lamports each)`);

  const signatures: string[] = [];

  for (const player of realPlayers) {
    try {
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: escrow.publicKey,
          toPubkey: new PublicKey(player.walletAddress),
          lamports: amountPerPlayer,
        }),
      );

      const sig = await sendAndConfirmTransaction(connection, tx, [escrow]);
      signatures.push(sig);
      log('Refund', `Refunded ${amountPerPlayer} lamports to ${player.walletAddress}: ${sig}`);
    } catch (err) {
      log('Refund', `Failed refund to ${player.walletAddress}: ${err}`);
      signatures.push('FAILED');
    }
  }

  return signatures;
}
