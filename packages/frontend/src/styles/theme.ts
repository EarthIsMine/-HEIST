export const theme = {
  colors: {
    bg: '#0a0e17',
    bgLight: '#131a2b',
    primary: '#00d4ff',
    secondary: '#ff6b35',
    cop: '#4a9eff',
    copLight: '#7bb8ff',
    thief: '#ff4757',
    thiefLight: '#ff6b7a',
    gold: '#ffd700',
    jail: '#888888',
    text: '#e8e8e8',
    textDim: '#8892a4',
    success: '#2ed573',
    danger: '#ff4757',
    border: '#1e2a3a',
  },
  fonts: {
    main: "'Segoe UI', system-ui, -apple-system, sans-serif",
    mono: "'Fira Code', 'Cascadia Code', monospace",
  },
  spacing: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  radius: {
    sm: '4px',
    md: '8px',
    lg: '12px',
  },
};

export type Theme = typeof theme;
