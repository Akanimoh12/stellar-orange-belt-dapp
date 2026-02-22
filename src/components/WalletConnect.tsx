import React, { useState } from 'react';
import { FiLink, FiLogOut, FiUser } from 'react-icons/fi';
import { useWallet } from '../hooks/useWallet';
import WalletModal from './WalletModal';

const WalletConnect: React.FC = () => {
  const { wallet, disconnect } = useWallet();
  const [modalOpen, setModalOpen] = useState(false);

  if (wallet) {
    return (
      <div className="wallet-connected">
        <div className="wallet-badge">
          <FiUser size={14} />
          <span className="wallet-badge-type">{wallet.walletType}</span>
          <span className="wallet-badge-addr">
            {wallet.publicKey.slice(0, 6)}...{wallet.publicKey.slice(-4)}
          </span>
        </div>
        <button className="btn-icon btn-icon-danger" onClick={disconnect} title="Disconnect">
          <FiLogOut size={16} />
        </button>
      </div>
    );
  }

  return (
    <>
      <button className="btn btn-connect" onClick={() => setModalOpen(true)}>
        <FiLink size={15} /> Connect Wallet
      </button>
      <WalletModal open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};

export default WalletConnect;
