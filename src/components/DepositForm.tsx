import React, { useState, useEffect } from 'react';
import { FiArrowDownCircle, FiCheckCircle, FiExternalLink } from 'react-icons/fi';
import { useWallet } from '../hooks/useWallet';
import { useDeposit } from '../hooks/useDeposit';
import { TxProgress } from '../utils/helpers';
import { AppErrorType } from '../types';

const DepositForm: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { wallet } = useWallet();
  const { submitDeposit, result, loading, error, reset } = useDeposit();
  const [amount, setAmount] = useState('');

  // Track tx progress stage
  const stage = loading
    ? 'submitting'
    : result?.success
    ? 'done'
    : error
    ? 'error'
    : 'idle';

  // Auto-refresh parent on success
  useEffect(() => {
    if (result?.success && onSuccess) onSuccess();
  }, [result, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    await submitDeposit(wallet.publicKey, Math.floor(num * 10_000_000));
  };

  if (!wallet) {
    return (
      <div>
        <h2><FiArrowDownCircle size={18} /> Deposit</h2>
        <p className="hint-text">Connect your wallet to deposit XLM into the vault.</p>
      </div>
    );
  }

  return (
    <div>
      <h2><FiArrowDownCircle size={18} /> Deposit XLM</h2>

      {error && (
        <div className={`error ${
          error.type === AppErrorType.TRANSACTION_REJECTED ? 'error-warning' :
          error.type === AppErrorType.INSUFFICIENT_BALANCE ? 'error-danger' : ''
        }`}>
          <strong>{error.type.replace(/_/g, ' ')}:</strong> {error.message}
        </div>
      )}

      <TxProgress stage={stage} />

      {result?.success ? (
        <div className="success-box">
          <FiCheckCircle size={20} />
          <div>
            <p><strong>Deposit Successful!</strong></p>
            <a
              href={`https://stellar.expert/explorer/testnet/tx/${result.hash}`}
              target="_blank"
              rel="noreferrer"
              className="tx-link"
            >
              <FiExternalLink size={12} /> View on Stellar Expert
            </a>
          </div>
          <button className="btn btn-sm" onClick={() => { reset(); setAmount(''); }} style={{ marginLeft: 'auto' }}>
            Deposit Again
          </button>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="deposit-amount">Amount (XLM)</label>
            <input
              id="deposit-amount"
              type="number"
              step="0.01"
              min="0.01"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g. 10.00"
              required
              disabled={loading}
            />
          </div>
          <button className="btn" type="submit" disabled={loading || !amount}>
            <FiArrowDownCircle size={15} /> {loading ? 'Processing...' : 'Deposit'}
          </button>
        </form>
      )}
    </div>
  );
};

export default DepositForm;
