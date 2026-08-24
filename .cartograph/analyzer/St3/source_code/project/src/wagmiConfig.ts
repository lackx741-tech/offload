import { http, createConfig } from 'wagmi';
import { mainnet, sepolia, polygon, optimism, arbitrum, base } from 'wagmi/chains';
import { injected, walletConnect, coinbaseWallet } from 'wagmi/connectors';
import { createAppKit } from '@reown/appkit/react';
import { WagmiAdapter } from '@reown/appkit-adapter-wagmi';
import type { AppKitNetwork } from '@reown/appkit/networks';

export const projectId = process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

// Sequence 0x Singleton Contract Addresses (CREATE2 — same on all chains)
export const SEQUENCE_CONTRACTS = {
  factory:         '0x653c0bd75e353f1FFeeb8AC9A510ea30F9064ceF',
  erc4337Factory:  '0xC67c4793bDb979A1a4cd97311c7644b4f7a31ff9',
  stage1Module:    '0xfBC5a55501E747b0c9F82e2866ab2609Fa9b99f4',
  stage2Module:    '0x5C9C4AD7b287D37a37d267089e752236f368f94f',
  guest:           '0x2d21Ce2fBe0BAD8022BaE10B5C22eA69fE930Ee6',
  sessionManager:  '0x4AE428352317752a51Ac022C9D2551BcDef785cb',
  eip7702Module:   '0x1f82E64E694894BACfa441709fC7DD8a30FA3E5d',
  batchMulticall:  '0xF93E987DF029e95CdE59c0F5cD447e0a7002054D',
  permit2Executor: '0x4593D97d6E932648fb4425aC2945adaF66927773',
  erc2612Executor: '0xb8eF065061bbBF5dCc65083be8CC7B50121AE900',
  permit2:         '0x000000000022D473030F116dDEE9F6B43aC78BA3',
  entryPointV07:   '0x0000000071727De22E5E9d8BAf0edAc6f37da032',
} as const;

export type SequenceContractKey = keyof typeof SEQUENCE_CONTRACTS;

const appKitNetworks = [mainnet, sepolia, polygon, optimism, arbitrum, base] as [
  AppKitNetwork,
  ...AppKitNetwork[]
];

// WagmiAdapter drives the wagmi config used by AppKit
export const wagmiAdapter = new WagmiAdapter({
  networks: appKitNetworks,
  projectId,
  ssr: false,
});

// Initialize AppKit modal (singleton — must be called once before any component mounts)
createAppKit({
  adapters: [wagmiAdapter],
  networks: appKitNetworks,
  projectId,
  metadata: {
    name: 'WagmiKit',
    description: 'Sequence 0x · Batch · Gasless · Permit2',
    url: typeof window !== 'undefined' ? window.location.origin : 'https://localhost',
    icons: ['https://avatars.githubusercontent.com/u/37784886'],
  },
  features: {
    analytics: false,
    email: false,
    socials: false,
  },
  themeMode: 'dark',
  themeVariables: {
    '--w3m-color-mix': '#0f1117',
    '--w3m-color-mix-strength': 40,
    '--w3m-accent': '#3b82f6',
    '--w3m-border-radius-master': '12px',
  },
});

// Plain wagmi config for panels that use wagmi hooks directly
export const wagmiConfig = wagmiAdapter.wagmiConfig ?? createConfig({
  chains: [mainnet, sepolia, polygon, optimism, arbitrum, base],
  connectors: [
    injected({ target: 'metaMask' }),
    injected(),
    walletConnect({ projectId }),
    coinbaseWallet({ appName: 'WagmiKit' }),
  ],
  transports: {
    [mainnet.id]: http(),
    [sepolia.id]: http(),
    [polygon.id]: http(),
    [optimism.id]: http(),
    [arbitrum.id]: http(),
    [base.id]: http(),
  },
});
