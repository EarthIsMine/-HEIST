import { useRef, useCallback, useEffect } from 'react';
import styled from 'styled-components';
import { getSocket } from '../../net/socket';

const RADIUS = 56;
const KNOB_RADIUS = 24;

const Container = styled.div`
  position: absolute;
  bottom: 80px;
  left: 24px;
  z-index: 15;
  display: none;
  pointer-events: auto;
  touch-action: none;

  @media (pointer: coarse) {
    display: block;
  }
`;

const Base = styled.div`
  width: ${RADIUS * 2}px;
  height: ${RADIUS * 2}px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.08);
  border: 2px solid rgba(255, 255, 255, 0.2);
  position: relative;
  backdrop-filter: blur(4px);
`;

const Knob = styled.div`
  width: ${KNOB_RADIUS * 2}px;
  height: ${KNOB_RADIUS * 2}px;
  border-radius: 50%;
  background: rgba(255, 255, 255, 0.35);
  border: 2px solid rgba(255, 255, 255, 0.5);
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  pointer-events: none;
`;

export function MobileDPad() {
  const baseRef = useRef<HTMLDivElement>(null);
  const knobRef = useRef<HTMLDivElement>(null);
  const activeTouch = useRef<number | null>(null);

  const emitDir = useCallback((x: number, y: number) => {
    getSocket().emit('input_move', { x, y });
  }, []);

  const updateKnob = useCallback((dx: number, dy: number) => {
    if (!knobRef.current) return;
    knobRef.current.style.transform = `translate(calc(-50% + ${dx}px), calc(-50% + ${dy}px))`;
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (activeTouch.current !== null) return;
    const touch = e.changedTouches[0];
    activeTouch.current = touch.identifier;
    handleMove(touch);
  }, []);

  const handleMove = useCallback((touch: React.Touch | Touch) => {
    const base = baseRef.current;
    if (!base) return;

    const rect = base.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let dx = touch.clientX - cx;
    let dy = touch.clientY - cy;
    const dist = Math.sqrt(dx * dx + dy * dy);
    const maxDist = RADIUS - KNOB_RADIUS;

    if (dist > maxDist) {
      dx = (dx / dist) * maxDist;
      dy = (dy / dist) * maxDist;
    }

    updateKnob(dx, dy);

    const nx = dx / maxDist;
    const ny = dy / maxDist;
    const len = Math.sqrt(nx * nx + ny * ny);

    if (len < 0.15) {
      emitDir(0, 0);
    } else {
      emitDir(nx / len, ny / len);
    }
  }, [emitDir, updateKnob]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouch.current) {
        handleMove(e.changedTouches[i]);
        break;
      }
    }
  }, [handleMove]);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === activeTouch.current) {
        activeTouch.current = null;
        updateKnob(0, 0);
        emitDir(0, 0);
        break;
      }
    }
  }, [emitDir, updateKnob]);

  useEffect(() => {
    return () => {
      emitDir(0, 0);
    };
  }, [emitDir]);

  return (
    <Container>
      <Base
        ref={baseRef}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onTouchCancel={handleTouchEnd}
      >
        <Knob ref={knobRef} />
      </Base>
    </Container>
  );
}
