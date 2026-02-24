let current: HTMLAudioElement | null = null;
let currentSrc = '';

export function playBGM(src: string, volume = 0.3): void {
  if (currentSrc === src && current && !current.paused) return;

  stopBGM();

  current = new Audio(src);
  current.loop = true;
  current.volume = volume;
  currentSrc = src;

  // Browsers block autoplay until user interaction
  current.play().catch(() => {
    const resume = () => {
      current?.play();
      window.removeEventListener('click', resume);
      window.removeEventListener('keydown', resume);
      window.removeEventListener('touchstart', resume);
    };
    window.addEventListener('click', resume, { once: true });
    window.addEventListener('keydown', resume, { once: true });
    window.addEventListener('touchstart', resume, { once: true });
  });
}

export function stopBGM(): void {
  if (current) {
    current.pause();
    current.src = '';
    current = null;
    currentSrc = '';
  }
}
