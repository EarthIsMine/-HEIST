import styled from 'styled-components';
import type { RoomInfo } from '@heist/shared';

const Card = styled.div<{ $isFull: boolean }>`
  background: #131a2b;
  border: 1px solid #1e2a3a;
  border-radius: 8px;
  padding: 16px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  opacity: ${(p) => (p.$isFull ? 0.5 : 1)};
`;

const Info = styled.div`
  h3 {
    font-size: 16px;
    margin-bottom: 4px;
  }
  span {
    color: #8892a4;
    font-size: 13px;
  }
`;

const JoinBtn = styled.button<{ disabled: boolean }>`
  background: ${(p) => (p.disabled ? '#333' : '#00d4ff')};
  color: ${(p) => (p.disabled ? '#666' : '#000')};
  padding: 8px 20px;
  border-radius: 6px;
  font-weight: 600;
  font-size: 14px;
`;

interface Props {
  room: RoomInfo;
  onJoin: (roomId: string) => void;
}

export function RoomCard({ room, onJoin }: Props) {
  const isFull = room.players.length >= room.maxPlayers;

  return (
    <Card $isFull={isFull}>
      <Info>
        <h3>{room.name}</h3>
        <span>
          {room.players.length}/{room.maxPlayers} players
        </span>
      </Info>
      <JoinBtn disabled={isFull} onClick={() => !isFull && onJoin(room.id)}>
        {isFull ? 'Full' : 'Join'}
      </JoinBtn>
    </Card>
  );
}
