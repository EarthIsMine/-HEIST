/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_SERVER_URL: string;
  readonly VITE_SOLANA_CLUSTER: string;
  readonly VITE_ESCROW_PUBKEY: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
