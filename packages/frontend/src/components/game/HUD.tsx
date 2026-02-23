import styled from 'styled-components';
import { useGameStore } from '../../stores/useGameStore';
import { THIEF_COUNT } from '@heist/shared';

const HUDContainer = styled.div`
  position: absolute;
  top: 16px;
  left: 16px;
  right: 16px;
  display: flex;
  justify-content: space-between;
  pointer-events: none;
  z-index: 10;
`;

const Panel = styled.div`
  background: rgba(10, 14, 23, 0.85);
  border: 1px solid #1e2a3a;
  border-radius: 8px;
  padding: 10px 16px;
  backdrop-filter: blur(4px);
`;

const Timer = styled.div`
  font-size: 24px;
  font-weight: bold;
  font-family: 'Fira Code', monospace;
  color: #e8e8e8;
`;

const PhaseLabel = styled.div<{ $phase: string }>`
  font-size: 12px;
  color: ${(p) =>
    p.$phase === 'head_start' ? '#ffd700' : p.$phase === 'playing' ? '#2ed573' : '#8892a4'};
  text-transform: uppercase;
  font-weight: 600;
`;

const RoleTag = styled.div<{ $team: string }>`
  font-size: 14px;
  font-weight: bold;
  color: ${(p) => (p.$team === 'cop' ? '#4a9eff' : '#ff4757')};
  padding: 4px 12px;
  border: 1px solid ${(p) => (p.$team === 'cop' ? '#4a9eff' : '#ff4757')};
  border-radius: 4px;
`;

const CoinsInfo = styled.div`
  font-size: 14px;
  color: #ffd700;
  span {
    color: #8892a4;
    font-size: 12px;
  }
`;

const JailInfo = styled.div`
  font-size: 13px;
  color: #ff4757;
`;

const CountdownOverlay = styled.div`
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  text-align: center;
  pointer-events: none;
  z-index: 20;
`;

const CountdownNumber = styled.div`
  font-size: 96px;
  font-weight: 900;
  font-family: 'Fira Code', monospace;
  color: #ffd700;
  text-shadow: 0 0 40px rgba(255, 215, 0, 0.5), 0 4px 8px rgba(0, 0, 0, 0.6);
  line-height: 1;
`;

const CountdownLabel = styled.div<{ $team: string }>`
  font-size: 20px;
  font-weight: 600;
  color: ${(p) => (p.$team === 'cop' ? '#4a9eff' : '#ff4757')};
  margin-top: 12px;
`;

function formatTime(ms: number): string {
  const totalSec = Math.ceil(ms / 1000);
  const min = Math.floor(totalSec / 60);
  const sec = totalSec % 60;
  return `${min}:${sec.toString().padStart(2, '0')}`;
}

export function HUD() {
  const snapshot = useGameStore((s) => s.snapshot);
  const myTeam = useGameStore((s) => s.myTeam);

  if (!snapshot) return null;

  const totalStolen = Math.floor(snapshot.stolenCoins);
  const totalCoins = snapshot.totalCoins;
  const remainingCoins = Math.ceil(snapshot.storages.reduce((sum, s) => sum + s.remainingCoins, 0));
  const jailCount = snapshot.jail.inmates.length;

  const headStartSec = Math.ceil(snapshot.headStartTimerMs / 1000);

  return (
    <>
      <HUDContainer>
        <Panel>
          <PhaseLabel $phase={snapshot.phase}>
            {snapshot.phase === 'head_start'
              ? `Head Start ${formatTime(snapshot.headStartTimerMs)}`
              : snapshot.phase}
          </PhaseLabel>
          <Timer>{formatTime(snapshot.matchTimerMs)}</Timer>
        </Panel>

        <Panel style={{ textAlign: 'center' }}>
          {myTeam === 'cop' ? (
            <CoinsInfo>
              {remainingCoins} <span>coins remaining</span>
            </CoinsInfo>
          ) : (
            <CoinsInfo>
              {totalStolen}/{totalCoins} <span>coins stolen</span>
            </CoinsInfo>
          )}
          {jailCount > 0 && <JailInfo>{jailCount}/{THIEF_COUNT} thieves jailed</JailInfo>}
        </Panel>

        <Panel>
          {myTeam && (
            <RoleTag $team={myTeam}>{myTeam === 'cop' ? 'POLICE' : 'THIEF'}</RoleTag>
          )}
        </Panel>
      </HUDContainer>

      {snapshot.phase === 'head_start' && myTeam && (
        <CountdownOverlay>
          <CountdownNumber>{headStartSec}</CountdownNumber>
          <CountdownLabel $team={myTeam}>
            {myTeam === 'cop' ? 'Get ready to chase!' : 'Move now! Stealing starts after countdown'}
          </CountdownLabel>
        </CountdownOverlay>
      )}
    </>
  );
}
