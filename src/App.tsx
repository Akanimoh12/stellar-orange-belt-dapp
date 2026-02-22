import React, { useState } from 'react';
import { HiOutlineGlobeAlt } from 'react-icons/hi';
import { FiShield, FiArrowDownCircle, FiArrowUpCircle, FiActivity } from 'react-icons/fi';
import WalletConnect from './components/WalletConnect';
import VaultDashboard from './components/VaultDashboard';
import DepositForm from './components/DepositForm';
import WithdrawPanel from './components/WithdrawPanel';
import EventFeed from './components/EventFeed';
import { WalletProvider, useWallet } from './hooks/useWallet';

type Tab = 'vault' | 'deposit' | 'withdraw' | 'activity';

const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
  { id: 'vault', label: 'Vault', icon: <FiShield size={16} /> },
  { id: 'deposit', label: 'Deposit', icon: <FiArrowDownCircle size={16} /> },
  { id: 'withdraw', label: 'Withdraw', icon: <FiArrowUpCircle size={16} /> },
  { id: 'activity', label: 'Activity', icon: <FiActivity size={16} /> },
];

const AppContent: React.FC = () => {
  const { wallet } = useWallet();
  const [activeTab, setActiveTab] = useState<Tab>('vault');
  const [refreshKey, setRefreshKey] = useState(0);

  const refresh = () => setRefreshKey((k) => k + 1);

  return (
    <div className="app-layout">
      {/* Top bar */}
      <header className="topbar">
        <div className="topbar-inner">
          <div className="topbar-brand">
            <FiShield size={22} />
            <span className="topbar-title">StellarVault</span>
            <span className="topbar-badge">Testnet</span>
          </div>
          <WalletConnect />
        </div>
      </header>

      {/* Tab navigation */}
      <nav className="tab-nav">
        <div className="tab-nav-inner">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`tab-btn ${activeTab === tab.id ? 'tab-btn-active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Main */}
      <main className="main-content">
        <div className="content-container">
          {activeTab === 'vault' && (
            <section className="page-section" key={`vault-${refreshKey}`}>
              <div className="card">
                <VaultDashboard />
              </div>
            </section>
          )}

          {activeTab === 'deposit' && (
            <section className="page-section">
              {!wallet ? (
                <div className="empty-state">
                  <FiArrowDownCircle size={40} className="empty-icon" />
                  <h3>Connect Wallet to Deposit</h3>
                  <p>Connect your Stellar wallet to deposit XLM into the vault.</p>
                </div>
              ) : (
                <div className="split-layout">
                  <div className="card">
                    <DepositForm onSuccess={refresh} />
                  </div>
                  <div className="card info-card">
                    <h3>How It Works</h3>
                    <ul className="info-list">
                      <li>Deposit XLM from your wallet into the vault contract</li>
                      <li>Your funds are tracked per-wallet on-chain</li>
                      <li>Optionally set a timelock to prevent early withdrawal</li>
                      <li>Withdraw anytime (unless timelocked)</li>
                    </ul>
                  </div>
                </div>
              )}
            </section>
          )}

          {activeTab === 'withdraw' && (
            <section className="page-section">
              {!wallet ? (
                <div className="empty-state">
                  <FiArrowUpCircle size={40} className="empty-icon" />
                  <h3>Connect Wallet to Withdraw</h3>
                  <p>Connect your wallet to withdraw or set a timelock on your vault.</p>
                </div>
              ) : (
                <div className="card">
                  <WithdrawPanel onSuccess={refresh} />
                </div>
              )}
            </section>
          )}

          {activeTab === 'activity' && (
            <section className="page-section">
              <div className="card">
                <EventFeed />
              </div>
            </section>
          )}
        </div>
      </main>

      <footer className="app-footer">
        <HiOutlineGlobeAlt size={14} />
        <span>Built on Stellar Soroban &bull; Token Vault &bull; Orange Belt Challenge</span>
      </footer>
    </div>
  );
};

function App() {
  return (
    <WalletProvider>
      <AppContent />
    </WalletProvider>
  );
}

export default App;
