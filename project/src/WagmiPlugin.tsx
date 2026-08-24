/**
 * Drop-in Wagmi Wallet Plugin
 *
 * Usage on any site:
 *   import { WagmiPlugin } from './WagmiPlugin';
 *   <WagmiPlugin />
 *
 * This wraps WagmiWalletButton with its own WagmiProvider + QueryClientProvider
 * so it is fully self-contained and can be embedded anywhere.
 */
import { WagmiProvider } from 'wagmi';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { wagmiAdapter, wagmiConfig } from './wagmiConfig';
import WagmiWalletButton from './components/WagmiWalletButton';

const queryClient = new QueryClient();

export function WagmiPlugin() {
  const config = wagmiAdapter.wagmiConfig ?? wagmiConfig;
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <WagmiWalletButton />
      </QueryClientProvider>
    </WagmiProvider>
  );
}
