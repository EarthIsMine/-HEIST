import { useCallback } from 'react';
import styled from 'styled-components';
import { addKey, removeKey } from '../../input/keyboard';

const DPadContainer = styled.div`
  position: absolute;
  bottom: 80px;
  left: 24px;
  z-index: 15;
  display: none;
  pointer-events: auto;

  @media (pointer: coarse) {
    display: block;
  }
`;

const DPadGrid = styled.div`
  display: grid;
  grid-template-columns: 56px 56px 56px;
  grid-template-rows: 56px 56px 56px;
  gap: 4px;
`;

const ArrowBtn = styled.button`
  width: 56px;
  height: 56px;
  border-radius: 12px;
  border: 2px solid rgba(255, 255, 255, 0.25);
  background: rgba(255, 255, 255, 0.12);
  color: #fff;
  font-size: 22px;
  display: flex;
  align-items: center;
  justify-content: center;
  touch-action: none;
  user-select: none;
  -webkit-user-select: none;
  backdrop-filter: blur(4px);

  &:active {
    background: rgba(255, 255, 255, 0.3);
  }
`;

const Empty = styled.div``;

const KEY_MAP: Record<string, string> = {
  up: 'ArrowUp',
  down: 'ArrowDown',
  left: 'ArrowLeft',
  right: 'ArrowRight',
};

export function MobileDPad() {
  const handleTouchStart = useCallback((dir: string) => (e: React.TouchEvent) => {
    e.preventDefault();
    addKey(KEY_MAP[dir]);
  }, []);

  const handleTouchEnd = useCallback((dir: string) => (e: React.TouchEvent) => {
    e.preventDefault();
    removeKey(KEY_MAP[dir]);
  }, []);

  return (
    <DPadContainer>
      <DPadGrid>
        <Empty />
        <ArrowBtn
          onTouchStart={handleTouchStart('up')}
          onTouchEnd={handleTouchEnd('up')}
        >
          ▲
        </ArrowBtn>
        <Empty />

        <ArrowBtn
          onTouchStart={handleTouchStart('left')}
          onTouchEnd={handleTouchEnd('left')}
        >
          ◀
        </ArrowBtn>
        <Empty />
        <ArrowBtn
          onTouchStart={handleTouchStart('right')}
          onTouchEnd={handleTouchEnd('right')}
        >
          ▶
        </ArrowBtn>

        <Empty />
        <ArrowBtn
          onTouchStart={handleTouchStart('down')}
          onTouchEnd={handleTouchEnd('down')}
        >
          ▼
        </ArrowBtn>
        <Empty />
      </DPadGrid>
    </DPadContainer>
  );
}
