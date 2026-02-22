import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from 'styled-components';
import { GlobalStyle } from './styles/GlobalStyle';
import { theme } from './styles/theme';
import { SolanaProvider } from './providers/SolanaProvider';
import { SocketProvider } from './providers/SocketProvider';
import { LobbyPage } from './pages/LobbyPage';
import { GamePage } from './pages/GamePage';

export function App() {
  return (
    <ThemeProvider theme={theme}>
      <GlobalStyle />
      <SolanaProvider>
        <SocketProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<LobbyPage />} />
              <Route path="/game/:roomId" element={<GamePage />} />
            </Routes>
          </BrowserRouter>
        </SocketProvider>
      </SolanaProvider>
    </ThemeProvider>
  );
}
