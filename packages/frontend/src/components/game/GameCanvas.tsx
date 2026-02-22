import { useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Renderer } from '../../canvas/Renderer';
import { initKeyboard } from '../../input/keyboard';
import { CANVAS_WIDTH, CANVAS_HEIGHT } from '@heist/shared';

const CanvasWrapper = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  flex: 1;
`;

const StyledCanvas = styled.canvas`
  border: 2px solid #1e2a3a;
  border-radius: 8px;
`;

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const renderer = new Renderer(canvas);
    renderer.start();

    const cleanupKeyboard = initKeyboard();

    return () => {
      renderer.stop();
      cleanupKeyboard();
    };
  }, []);

  return (
    <CanvasWrapper>
      <StyledCanvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />
    </CanvasWrapper>
  );
}
