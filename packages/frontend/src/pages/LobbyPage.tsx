import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { useWallet, useConnection } from '@solana/wallet-adapter-react';
import { PublicKey, LAMPORTS_PER_SOL } from '@solana/web3.js';
import { WalletButton } from '../components/common/WalletButton';
import { useLobbyStore } from '../stores/useLobbyStore';
import { useGameStore } from '../stores/useGameStore';
import { getSocket } from '../net/socket';
import { buildEntryFeeTx } from '../solana/entryFee';
import { ENTRY_FEE_LAMPORTS } from '@heist/shared';
import type { Team } from '@heist/shared';

const Container = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 40px;
`;

const Header = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;
  max-width: 700px;
  margin-bottom: 32px;
`;

const Title = styled.h1`
  font-size: 36px;
  font-weight: 800;
  background: linear-gradient(135deg, #00d4ff, #ff6b35);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  letter-spacing: 4px;
`;

const Content = styled.div`
  width: 100%;
  max-width: 700px;
`;

const Section = styled.div`
  background: #131a2b;
  border: 1px solid #1e2a3a;
  border-radius: 12px;
  padding: 24px;
  margin-bottom: 16px;
`;

const SectionTitle = styled.h2`
  font-size: 18px;
  margin-bottom: 16px;
  color: #e8e8e8;
`;

const Input = styled.input`
  width: 100%;
  padding: 10px 14px;
  background: #0a0e17;
  border: 1px solid #1e2a3a;
  border-radius: 6px;
  color: #e8e8e8;
  font-size: 14px;
  margin-bottom: 12px;

  &::placeholder {
    color: #8892a4;
  }
`;

const Button = styled.button<{ $variant?: string }>`
  padding: 10px 24px;
  border-radius: 8px;
  font-weight: 600;
  font-size: 14px;
  background: ${(p) =>
    p.$variant === 'secondary'
      ? '#1e2a3a'
      : p.$variant === 'success'
        ? '#2ed573'
        : '#00d4ff'};
  color: ${(p) => (p.$variant === 'secondary' ? '#e8e8e8' : '#000')};
  margin-right: 8px;
`;

const PlayerList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin-top: 12px;
`;

const PlayerRow = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 8px 12px;
  background: #0a0e17;
  border-radius: 6px;
  font-size: 14px;
`;

const Badge = styled.span<{ $color: string }>`
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: ${(p) => p.$color};
  color: #000;
  font-weight: 600;
`;

const InfoText = styled.p`
  color: #8892a4;
  font-size: 13px;
  margin-top: 8px;
`;

const TeamSelector = styled.div`
  display: flex;
  gap: 12px;
  margin-bottom: 16px;
`;

const TeamButton = styled.button<{ $active: boolean; $team: string }>`
  flex: 1;
  padding: 16px;
  border-radius: 10px;
  font-weight: 700;
  font-size: 16px;
  border: 3px solid ${(p) =>
    p.$active
      ? p.$team === 'cop' ? '#4a9eff' : '#ff4757'
      : '#1e2a3a'};
  background: ${(p) =>
    p.$active
      ? p.$team === 'cop' ? 'rgba(74, 158, 255, 0.15)' : 'rgba(255, 71, 87, 0.15)'
      : '#0a0e17'};
  color: ${(p) =>
    p.$team === 'cop' ? '#4a9eff' : '#ff4757'};
  transition: all 0.15s;

  &:hover {
    border-color: ${(p) => p.$team === 'cop' ? '#4a9eff' : '#ff4757'};
  }
`;

export function LobbyPage() {
  const navigate = useNavigate();
  const { publicKey, sendTransaction, connected } = useWallet();
  const { connection } = useConnection();

  const currentRoom = useLobbyStore((s) => s.currentRoom);
  const entryPaid = useLobbyStore((s) => s.entryPaid);
  const isReady = useLobbyStore((s) => s.isReady);
  const setEntryPaid = useLobbyStore((s) => s.setEntryPaid);
  const setReady = useLobbyStore((s) => s.setReady);
  const snapshot = useGameStore((s) => s.snapshot);

  const [roomId, setRoomId] = useState('heist-room-1');
  const [playerName, setPlayerName] = useState('');
  const [paying, setPaying] = useState(false);
  const [balance, setBalance] = useState<number | null>(null);
  const [selectedTeam, setSelectedTeam] = useState<Team>('thief');

  // Navigate to game when game starts
  useEffect(() => {
    if (snapshot && snapshot.phase !== 'lobby') {
      navigate(`/game/${currentRoom?.id || 'live'}`);
    }
  }, [snapshot, currentRoom, navigate]);

  // Fetch balance
  useEffect(() => {
    if (!publicKey) return;
    connection.getBalance(publicKey).then((bal) => {
      setBalance(bal / LAMPORTS_PER_SOL);
    });
  }, [publicKey, connection]);

  const handleJoin = useCallback(() => {
    if (!connected || !publicKey) return;
    const name = playerName.trim() || `Player-${publicKey.toBase58().slice(0, 4)}`;
    const socket = getSocket();

    socket.emit(
      'join_room',
      roomId,
      { name, walletAddress: publicKey.toBase58() },
      (result) => {
        if (!result.ok) {
          alert(result.error || 'Failed to join room');
        }
      },
    );
  }, [connected, publicKey, playerName, roomId]);

  const handlePayEntry = useCallback(async () => {
    if (!publicKey || !sendTransaction) return;

    // Free entry: skip payment
    if (ENTRY_FEE_LAMPORTS === 0) {
      getSocket().emit('confirm_entry', 'free', (result) => {
        if (result.ok) {
          setEntryPaid(true, 'free');
        }
      });
      return;
    }

    setPaying(true);
    try {
      const escrowPubkey = new PublicKey(
        import.meta.env.VITE_ESCROW_PUBKEY || publicKey.toBase58(),
      );
      const tx = buildEntryFeeTx(publicKey, escrowPubkey);
      const sig = await sendTransaction(tx, connection);
      await connection.confirmTransaction(sig, 'confirmed');

      getSocket().emit('confirm_entry', sig, (result) => {
        if (result.ok) {
          setEntryPaid(true, sig);
        }
      });
    } catch (err) {
      console.error('Entry fee payment failed:', err);
      alert('Payment failed. Make sure you have enough SOL on devnet.');
    } finally {
      setPaying(false);
    }
  }, [publicKey, sendTransaction, connection, setEntryPaid]);

  const handleSelectTeam = useCallback((team: Team) => {
    setSelectedTeam(team);
    getSocket().emit('select_team', team);
  }, []);

  const handleReady = useCallback(() => {
    getSocket().emit('ready');
    setReady(true);
  }, [setReady]);

  return (
    <Container>
      <Header>
        <Title>HEIST</Title>
        <WalletButton />
      </Header>

      <Content>
        {!currentRoom ? (
          <Section>
            <SectionTitle>Join a Room</SectionTitle>
            <Input
              placeholder="Your name"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
            />
            <Input
              placeholder="Room ID"
              value={roomId}
              onChange={(e) => setRoomId(e.target.value)}
            />
            <Button onClick={handleJoin} disabled={!connected}>
              {connected ? 'Join Room' : 'Connect Wallet First'}
            </Button>
            {balance !== null && (
              <InfoText>Balance: {balance.toFixed(4)} SOL (devnet)</InfoText>
            )}
          </Section>
        ) : (
          <>
            <Section>
              <SectionTitle>
                {currentRoom.name} ({currentRoom.players.length}/{currentRoom.maxPlayers})
              </SectionTitle>

              <PlayerList>
                {currentRoom.players.map((p) => (
                  <PlayerRow key={p.id}>
                    <span>{p.name}</span>
                    <div>
                      {p.confirmed && <Badge $color="#2ed573">Paid</Badge>}{' '}
                      {p.ready && <Badge $color="#00d4ff">Ready</Badge>}
                    </div>
                  </PlayerRow>
                ))}
              </PlayerList>
            </Section>

            <Section>
              <SectionTitle>Choose Your Team</SectionTitle>
              <TeamSelector>
                <TeamButton
                  $active={selectedTeam === 'cop'}
                  $team="cop"
                  onClick={() => handleSelectTeam('cop')}
                >
                  POLICE
                </TeamButton>
                <TeamButton
                  $active={selectedTeam === 'thief'}
                  $team="thief"
                  onClick={() => handleSelectTeam('thief')}
                >
                  THIEF
                </TeamButton>
              </TeamSelector>
              <InfoText>Remaining slots will be filled with bots.</InfoText>
            </Section>

            <Section>
              <SectionTitle>Ready Up</SectionTitle>

              {ENTRY_FEE_LAMPORTS > 0 && !entryPaid ? (
                <>
                  <Button onClick={handlePayEntry} disabled={paying}>
                    {paying
                      ? 'Processing...'
                      : `Pay Entry Fee (${ENTRY_FEE_LAMPORTS / LAMPORTS_PER_SOL} SOL)`}
                  </Button>
                  <InfoText>
                    Entry fee will be sent to the escrow wallet. Winners split the pool.
                  </InfoText>
                </>
              ) : !isReady ? (
                <Button $variant="success" onClick={handleReady}>
                  Start Game!
                </Button>
              ) : (
                <InfoText>Waiting for all players to be ready...</InfoText>
              )}
            </Section>
          </>
        )}
      </Content>
    </Container>
  );
}
