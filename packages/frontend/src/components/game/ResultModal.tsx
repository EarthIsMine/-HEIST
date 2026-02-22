import styled from 'styled-components';
import { useGameStore } from '../../stores/useGameStore';
import { useLobbyStore } from '../../stores/useLobbyStore';
import { useNavigate } from 'react-router-dom';

const Overlay = styled.div`
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
`;

const Modal = styled.div`
  background: #131a2b;
  border: 1px solid #1e2a3a;
  border-radius: 16px;
  padding: 32px 48px;
  text-align: center;
  min-width: 400px;
`;

const Title = styled.h2<{ $win: boolean }>`
  font-size: 28px;
  color: ${(p) => (p.$win ? '#2ed573' : '#ff4757')};
  margin-bottom: 8px;
`;

const Reason = styled.p`
  color: #8892a4;
  font-size: 14px;
  margin-bottom: 24px;
`;

const Stat = styled.div`
  color: #e8e8e8;
  font-size: 16px;
  margin-bottom: 8px;
`;

const TxLink = styled.a`
  display: block;
  color: #00d4ff;
  font-size: 13px;
  margin: 4px 0;
  word-break: break-all;
`;

const BackButton = styled.button`
  margin-top: 24px;
  background: #00d4ff;
  color: #000;
  padding: 12px 32px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 16px;
`;

const reasonLabels: Record<string, string> = {
  all_coins_stolen: 'All coins were stolen!',
  all_thieves_jailed: 'All thieves were arrested!',
  time_expired: 'Time ran out!',
};

export function AbortModal() {
  const showAbortModal = useGameStore((s) => s.showAbortModal);
  const abortInfo = useGameStore((s) => s.abortInfo);
  const resetGame = useGameStore((s) => s.reset);
  const resetLobby = useLobbyStore((s) => s.reset);
  const navigate = useNavigate();

  if (!showAbortModal || !abortInfo) return null;

  return (
    <Overlay>
      <Modal>
        <Title $win={false}>GAME ABORTED</Title>
        <Reason>{abortInfo.reason}</Reason>

        {abortInfo.refundTxSignatures.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Stat style={{ fontSize: 13 }}>Refund Transactions:</Stat>
            {abortInfo.refundTxSignatures.map((sig, i) => (
              <TxLink
                key={i}
                href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`}
                target="_blank"
                rel="noopener"
              >
                {sig.slice(0, 20)}...{sig.slice(-20)}
              </TxLink>
            ))}
          </div>
        )}

        <BackButton
          onClick={() => {
            resetGame();
            resetLobby();
            navigate('/');
          }}
        >
          Back to Lobby
        </BackButton>
      </Modal>
    </Overlay>
  );
}

export function ResultModal() {
  const showResultModal = useGameStore((s) => s.showResultModal);
  const gameResult = useGameStore((s) => s.gameResult);
  const myTeam = useGameStore((s) => s.myTeam);
  const resetGame = useGameStore((s) => s.reset);
  const resetLobby = useLobbyStore((s) => s.reset);
  const navigate = useNavigate();

  if (!showResultModal || !gameResult) return null;

  const didWin = myTeam === gameResult.winningTeam;

  return (
    <Overlay>
      <Modal>
        <Title $win={didWin}>{didWin ? 'VICTORY!' : 'DEFEAT'}</Title>
        <Reason>{reasonLabels[gameResult.reason] || gameResult.reason}</Reason>

        <Stat>
          Winning Team:{' '}
          <strong style={{ color: gameResult.winningTeam === 'cop' ? '#4a9eff' : '#ff4757' }}>
            {gameResult.winningTeam === 'cop' ? 'Police' : 'Thieves'}
          </strong>
        </Stat>
        <Stat>Coins Stolen: {Math.floor(gameResult.stolenCoins)}/300</Stat>
        <Stat>
          Payout: {(gameResult.payoutLamports / 1_000_000_000).toFixed(4)} SOL per winner
        </Stat>

        {gameResult.payoutTxSignatures.length > 0 && (
          <div style={{ marginTop: 16 }}>
            <Stat style={{ fontSize: 13 }}>Payout Transactions:</Stat>
            {gameResult.payoutTxSignatures.map((sig, i) => (
              <TxLink
                key={i}
                href={`https://explorer.solana.com/tx/${sig}?cluster=devnet`}
                target="_blank"
                rel="noopener"
              >
                {sig.slice(0, 20)}...{sig.slice(-20)}
              </TxLink>
            ))}
          </div>
        )}

        <BackButton
          onClick={() => {
            resetGame();
            resetLobby();
            navigate('/');
          }}
        >
          Back to Lobby
        </BackButton>
      </Modal>
    </Overlay>
  );
}
