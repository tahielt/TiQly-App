import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { createWeb3Modal } from '@web3modal/wagmi/react';
import { defaultWagmiConfig } from '@web3modal/wagmi/react/config';
import { WagmiProvider } from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';
import { ReactNode, useEffect } from 'react';

// 0. Setup queryClient
const queryClient = new QueryClient();

// 1. Get projectId at https://cloud.walletconnect.com
const projectId = process.env.EXPO_PUBLIC_WALLETCONNECT_PROJECT_ID || '';

// 2. Create wagmiConfig
const metadata = {
  name: 'Tiqly App',
  description: 'Tiqly - Your Web3 Event Platform',
  url: 'https://tiqly.app',
  icons: ['https://tiqly.app/icon.png'],
};

const chains = [mainnet, sepolia] as const;

const config = defaultWagmiConfig({
  chains,
  projectId,
  metadata,
  // ...optional config
});

// 3. Create modal
export function createWeb3ModalComponent() {
  return createWeb3Modal({
    wagmiConfig: config,
    projectId,
    enableAnalytics: true,
    enableOnramp: true,
  });
}

export function Web3Provider({ children }: { children: ReactNode }) {
  // 4. Initialize Web3Modal
  useEffect(() => {
    createWeb3ModalComponent();
  }, []);

  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
