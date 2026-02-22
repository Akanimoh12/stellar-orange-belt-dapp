import React, { createContext, useContext, useState, useCallback } from 'react';
import { Wallet } from '../wallet/types';
import { WalletType, AppErrorType } from '../types';

async function loadWalletKit() {
  const { connectKit, selectWallet, WALLET_IDS } = await import('../wallet/kit');
  return { connectKit, selectWallet, WALLET_IDS };
}

interface WalletContextType {
  wallet: Wallet | null;
  loading: boolean;
  error: string | null;
  errorType: AppErrorType | null;
  connect: (type: WalletType) => Promise<void>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [wallet, setWallet] = useState<Wallet | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errorType, setErrorType] = useState<AppErrorType | null>(null);

  const connect = useCallback(async (type: WalletType) => {
    setLoading(true);
    setError(null);
    setErrorType(null);
    try {
      const { connectKit, selectWallet, WALLET_IDS } = await loadWalletKit();
      const walletId = WALLET_IDS[type] || WALLET_IDS.freighter;
      selectWallet(walletId);
      const publicKey = await connectKit();
      setWallet({ publicKey, walletType: type });
    } catch (err: any) {
      const msg = err.message || 'Failed to connect wallet';
      if (
        msg.includes('not installed') ||
        msg.includes('not available') ||
        msg.includes('not found') ||
        msg.includes('No module')
      ) {
        setErrorType(AppErrorType.WALLET_NOT_FOUND);
        setError(`${type} wallet extension not found. Please install it first.`);
      } else if (
        msg.includes('User declined') ||
        msg.includes('rejected') ||
        msg.includes('cancel') ||
        msg.includes('denied') ||
        msg.includes('closed')
      ) {
        setErrorType(AppErrorType.TRANSACTION_REJECTED);
        setError('Connection was cancelled or rejected.');
      } else if (
        type === 'xbull' &&
        (msg.includes('timeout') || msg.includes('postMessage') || msg.includes('bridge'))
      ) {
        setErrorType(AppErrorType.WALLET_NOT_FOUND);
        setError(
          'Could not connect to xBull. Make sure the popup was not blocked by your browser.'
        );
      } else {
        setErrorType(AppErrorType.NETWORK_ERROR);
        setError(msg);
      }
    } finally {
      setLoading(false);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet(null);
    setError(null);
    setErrorType(null);
  }, []);

  return (
    <WalletContext.Provider
      value={{ wallet, loading, error, errorType, connect, disconnect }}
    >
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWallet must be used within WalletProvider');
  return ctx;
};
