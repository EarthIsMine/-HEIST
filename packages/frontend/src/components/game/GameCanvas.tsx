import { useRef, useEffect } from 'react';
import styled from 'styled-components';
import { Renderer } from '../../canvas/Renderer';
import { initKeyboard } from '../../input/keyboard';

const CanvasWrapper = styled.div`
  position: absolute;
  inset: 0;
  overflow: hidden;
`;

const StyledCanvas = styled.canvas`
  display: block;
  width: 100%;
  height: 100%;
`;

export function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const dpr = window.devicePixelRatio || 1;

    const resize = () => {
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
    };
    resize();

    const renderer = new Renderer(canvas, dpr);
    renderer.start();

    const cleanupKeyboard = initKeyboard();

    window.addEventListener('resize', resize);

    return () => {
      renderer.stop();
      cleanupKeyboard();
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <CanvasWrapper>
      <StyledCanvas ref={canvasRef} />
    </CanvasWrapper>
  );
}
