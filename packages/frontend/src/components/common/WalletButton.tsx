import { useCallback } from 'react';
import { WalletMultiButton } from '@solana/wallet-adapter-react-ui';
import styled from 'styled-components';

const Wrapper = styled.div`
  .wallet-adapter-button {
    background: #1e2a3a !important;
    border-radius: 8px !important;
    font-size: 14px !important;
    height: 40px !important;
  }
`;

const PhantomDeepLinkBtn = styled.button`
  background: #1e2a3a;
  border-radius: 8px;
  font-size: 14px;
  height: 40px;
  color: #fff;
  padding: 0 16px;
  font-weight: 600;
  border: none;
  cursor: pointer;
`;

function isMobile(): boolean {
  return /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
}

function isPhantomInstalled(): boolean {
  return !!(window as any).phantom?.solana?.isPhantom;
}

export function WalletButton() {
  const openInPhantom = useCallback(() => {
    const url = encodeURIComponent(window.location.href);
    window.location.href = `https://phantom.app/ul/browse/${url}?ref=${encodeURIComponent(window.location.origin)}`;
  }, []);

  if (isMobile() && !isPhantomInstalled()) {
    return <PhantomDeepLinkBtn onClick={openInPhantom}>Open in Phantom</PhantomDeepLinkBtn>;
  }

  return (
    <Wrapper>
      <WalletMultiButton />
    </Wrapper>
  );
}
