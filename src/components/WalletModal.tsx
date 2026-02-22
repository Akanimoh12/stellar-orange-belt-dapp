import React from 'react';
import { FiX, FiLink, FiExternalLink } from 'react-icons/fi';
import { SiStellar } from 'react-icons/si';
import { useWallet } from '../hooks/useWallet';
import { WalletType, AppErrorType } from '../types';

const wallets: { type: WalletType; label: string; desc: string }[] = [
  { type: 'freighter', label: 'Freighter', desc: 'Browser extension wallet' },
  { type: 'xbull', label: 'xBull', desc: 'Advanced Stellar wallet' },
  { type: 'albedo', label: 'Albedo', desc: 'Web-based signer' },
];

interface WalletModalProps {
  open: boolean;
  onClose: () => void;
}

const WalletModal: React.FC<WalletModalProps> = ({ open, onClose }) => {
  const { wallet, loading, error, errorType, connect } = useWallet();

  React.useEffect(() => {
    if (wallet && open) onClose();
  }, [wallet, open, onClose]);

  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3><SiStellar size={20} /> Connect Wallet</h3>
          <button className="modal-close" onClick={onClose}><FiX size={20} /></button>
        </div>

        <p className="modal-subtitle">Choose a wallet to connect to Stellar Testnet</p>

        {error && (
          <div className={`error ${errorType === AppErrorType.WALLET_NOT_FOUND ? 'error-warning' : ''}`}>
            {error}
          </div>
        )}

        <div className="wallet-list">
          {wallets.map((w) => (
            <button
              key={w.type}
              className="wallet-option"
              onClick={() => connect(w.type)}
              disabled={loading}
            >
              <div className="wallet-option-icon"><FiLink size={18} /></div>
              <div className="wallet-option-info">
                <span className="wallet-option-name">{w.label}</span>
                <span className="wallet-option-desc">{w.desc}</span>
              </div>
              <FiExternalLink size={14} className="wallet-option-arrow" />
            </button>
          ))}
        </div>

        {loading && (
          <div className="modal-loading">
            <div className="spinner" />
            <span>Connecting...</span>
          </div>
        )}

        <p className="modal-footer-text">
          Don't have a wallet?{' '}
          <a href="https://www.freighter.app/" target="_blank" rel="noreferrer">
            Get Freighter <FiExternalLink size={11} />
          </a>
        </p>
      </div>
    </div>
  );
};

export default WalletModal;
