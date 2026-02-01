import { getDefaultConfig } from '@rainbow-me/rainbowkit';
import { mainnet, base, baseSepolia, arbitrum, optimism, polygon } from 'wagmi/chains';

export const config = getDefaultConfig({
  appName: 'NulSet Faucet',
  projectId: 'NULSET_DEMO_WALLET_CONNECT', // Demo project ID
  chains: [baseSepolia, base, mainnet, arbitrum, optimism, polygon],
  ssr: false,
});
