import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import React from 'react';

// Mock all external dependencies before importing App
vi.mock('@creit.tech/stellar-wallets-kit', () => ({
  StellarWalletsKit: vi.fn().mockImplementation(() => ({
    openModal: vi.fn(),
    setWallet: vi.fn(),
    getAddress: vi.fn().mockResolvedValue({ address: 'GTEST...' }),
    signTransaction: vi.fn(),
  })),
  WalletNetwork: { TESTNET: 'testnet' },
  allowAllModules: vi.fn(() => []),
  FREIGHTER_ID: 'freighter',
  XBULL_ID: 'xbull',
}));

vi.mock('@stellar/stellar-sdk', () => ({
  SorobanRpc: {
    Server: vi.fn().mockImplementation(() => ({})),
  },
  Horizon: {
    Server: vi.fn().mockImplementation(() => ({})),
  },
  Networks: { TESTNET: 'Test SDF Network ; September 2015' },
  nativeToScVal: vi.fn(),
  scValToNative: vi.fn(),
  Address: vi.fn().mockImplementation((addr: string) => ({
    toScVal: vi.fn(),
  })),
  Contract: vi.fn().mockImplementation(() => ({
    call: vi.fn(),
  })),
  TransactionBuilder: vi.fn().mockImplementation(() => ({
    addOperation: vi.fn().mockReturnThis(),
    setTimeout: vi.fn().mockReturnThis(),
    build: vi.fn(),
  })),
}));

vi.mock('@stellar/freighter-api', () => ({
  isConnected: vi.fn().mockResolvedValue(true),
  getPublicKey: vi.fn().mockResolvedValue('GTEST'),
}));

// Mock wallet hook
vi.mock('../hooks/useWallet', () => {
  const WalletContext = React.createContext<any>({
    wallet: null,
    loading: false,
    error: null,
    connect: vi.fn(),
    disconnect: vi.fn(),
  });
  return {
    WalletProvider: ({ children }: { children: React.ReactNode }) =>
      React.createElement(WalletContext.Provider, {
        value: { wallet: null, loading: false, error: null, connect: vi.fn(), disconnect: vi.fn() },
      }, children),
    useWallet: () => React.useContext(WalletContext),
  };
});

import App from '../App';

describe('App Component', () => {
  it('renders the app title', () => {
    render(<App />);
    expect(screen.getByText('StellarVault')).toBeInTheDocument();
  });

  it('renders testnet badge', () => {
    render(<App />);
    expect(screen.getByText('Testnet')).toBeInTheDocument();
  });

  it('renders tab navigation buttons', () => {
    render(<App />);
    expect(screen.getByText('Vault')).toBeInTheDocument();
    expect(screen.getByText('Deposit')).toBeInTheDocument();
    expect(screen.getByText('Withdraw')).toBeInTheDocument();
    expect(screen.getByText('Activity')).toBeInTheDocument();
  });

  it('renders the footer', () => {
    render(<App />);
    expect(screen.getByText(/Orange Belt Challenge/)).toBeInTheDocument();
  });
});
