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

export function WalletButton() {
  return (
    <Wrapper>
      <WalletMultiButton />
    </Wrapper>
  );
}
