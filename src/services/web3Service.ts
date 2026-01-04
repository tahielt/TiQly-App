import { 
  useAccount, 
  useConnect, 
  useDisconnect, 
  useSignMessage, 
  useChainId,
  useSwitchChain,
  useConfig
} from 'wagmi';
import { mainnet, sepolia } from 'wagmi/chains';

export interface WalletInfo {
  address: string;
  chainId: number;
  isConnected: boolean;
  connector?: string;
}

// Lista de cadenas soportadas por la aplicación
export const SUPPORTED_CHAINS = [mainnet, sepolia];

/**
 * Custom hook for handling Web3 functionality using wagmi
 * Provides methods for connecting/disconnecting wallets, signing messages, and more
 */
export function useWeb3Service() {
  // Get account and connection status
  const { 
    address, 
    isConnected, 
    connector 
  } = useAccount();
  
  // Get current chain ID
  const chainId = useChainId();
  const config = useConfig();
  
  // Wallet connection methods
  const { 
    connect, 
    connectors, 
    error: connectError 
  } = useConnect();
  
  // Disconnect method
  const { disconnect } = useDisconnect();
  
  // Network switching
  const { switchChain } = useSwitchChain();
  
  // Message signing
  const { signMessageAsync } = useSignMessage();

  /**
   * Connect to a wallet using the specified connector
   * @param connectorId - The ID of the wallet connector to use ('metaMask', 'walletConnect', 'coinbaseWallet')
   */
  const connectWallet = async (connectorId: 'metaMask' | 'walletConnect' | 'coinbaseWallet') => {
    try {
      const targetConnector = connectors.find(c => c.id === connectorId);
      if (!targetConnector) throw new Error('Connector not found');
      
      await connect({ connector: targetConnector });
      return { success: true };
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to connect' 
      };
    }
  };

  /**
   * Switch to a different network/chain
   * @param chainId - The chain ID to switch to
   */
  const changeNetwork = async (targetChainId: number) => {
    try {
      if (switchChain) {
        await switchChain({ chainId: targetChainId });
        return { success: true };
      }
      return { 
        success: false, 
        error: 'Switching networks is not supported' 
      };
    } catch (error) {
      console.error('Error switching network:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to switch network' 
      };
    }
  };

  /**
   * Sign a message with the connected wallet
   * @param message - The message to sign
   */
  const signMessage = async (message: string) => {
    try {
      if (!address) throw new Error('No wallet connected');
      const signature = await signMessageAsync({ message });
      return { 
        success: true, 
        signature 
      };
    } catch (error) {
      console.error('Error signing message:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to sign message' 
      };
    }
  };

  /**
   * Disconnect the currently connected wallet
   */
  const disconnectWallet = () => {
    try {
      disconnect();
      return { success: true };
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Failed to disconnect' 
      };
    }
  };

  /**
   * Get the current wallet info
   */
  const getWalletInfo = (): WalletInfo | null => {
    if (!address || !isConnected) return null;
    
    return {
      address: address || '',
      chainId,
      isConnected,
      connector: connector?.id,
    };
  };

  return {
    // Connection
    connectWallet,
    disconnectWallet,
    isConnected,
    
    // Account
    address,
    chainId,
    connector,
    
    // Network
    switchNetwork: changeNetwork,
    
    // Signing
    signMessage,
    
    // Utils
    getWalletInfo,
    
    // Errors
    error: connectError,
  };
}

// Export a hook version for React components
export const useWeb3 = useWeb3Service;

/**
 * Example usage in a component:
 * 
 * ```tsx
 * import { useWeb3 } from './services/web3Service';
 * 
 * function MyComponent() {
 *   const { 
 *     connectWallet, 
 *     disconnectWallet, 
 *     isConnected, 
 *     address, 
 *     signMessage 
 *   } = useWeb3();
 *   
 *   // Handle wallet connection
 *   const handleConnect = async () => {
 *     const result = await connectWallet('metaMask');
 *     if (!result.success) {
 *       console.error(result.error);
 *     }
 *   };
 *   
 *   // Handle message signing
 *   const handleSign = async () => {
 *     const result = await signMessage('Hello, Web3!');
 *     if (result.success) {
 *       console.log('Signature:', result.signature);
 *     } else {
 *       console.error(result.error);
 *     }
 *   };
 *   
 *   return (
 *     <div>
 *       {isConnected ? (
 *         <>
 *           <p>Connected: {address}</p>
 *           <button onClick={handleSign}>Sign Message</button>
 *           <button onClick={disconnectWallet}>Disconnect</button>
 *         </>
 *       ) : (
 *         <button onClick={handleConnect}>Connect Wallet</button>
 *       )}
 *     </div>
 *   );
 * }
 * ```
 */
