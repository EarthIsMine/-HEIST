import styled from 'styled-components';
import { GameCanvas } from '../components/game/GameCanvas';
import { HUD } from '../components/game/HUD';
import { SkillBar } from '../components/game/SkillBar';
import { ResultModal, AbortModal } from '../components/game/ResultModal';

const GameContainer = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  position: relative;
  background: #0a0e17;
`;

export function GamePage() {
  return (
    <GameContainer>
      <HUD />
      <GameCanvas />
      <SkillBar />
      <ResultModal />
      <AbortModal />
    </GameContainer>
  );
}
