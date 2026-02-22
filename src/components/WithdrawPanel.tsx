import React, { useState, useEffect } from 'react';
import {
  FiArrowUpCircle,
  FiCheckCircle,
  FiExternalLink,
  FiLock,
  FiClock,
} from 'react-icons/fi';
import { useWallet } from '../hooks/useWallet';
import { useWithdraw } from '../hooks/useWithdraw';
import { useVault } from '../hooks/useVault';
import { setTimelock } from '../services/contract';
import { formatXLM, timeUntil, TxProgress } from '../utils/helpers';
import { AppErrorType } from '../types';

const WithdrawPanel: React.FC<{ onSuccess?: () => void }> = ({ onSuccess }) => {
  const { wallet } = useWallet();
  const { userVault, isLocked, refetch } = useVault(wallet?.publicKey || null);
  const { submitWithdraw, result, loading, error, reset } = useWithdraw();
  const [amount, setAmount] = useState('');
  const [lockDays, setLockDays] = useState('');
  const [lockLoading, setLockLoading] = useState(false);
  const [lockResult, setLockResult] = useState<string | null>(null);
  const [lockError, setLockError] = useState<string | null>(null);

  const stage = loading
    ? 'submitting'
    : result?.success
    ? 'done'
    : error
    ? 'error'
    : 'idle';

  useEffect(() => {
    if (result?.success && onSuccess) {
      onSuccess();
      refetch();
    }
  }, [result, onSuccess, refetch]);

  const handleWithdraw = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) return;
    await submitWithdraw(wallet.publicKey, Math.floor(num * 10_000_000));
  };

  const handleSetLock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;
    const days = parseInt(lockDays, 10);
    if (isNaN(days) || days <= 0) return;

    setLockLoading(true);
    setLockError(null);
    setLockResult(null);
    try {
      const unlockTime = Math.floor(Date.now() / 1000) + days * 86400;
      const hash = await setTimelock(wallet.publicKey, unlockTime);
      setLockResult(hash);
      setLockDays('');
      refetch();
    } catch (err: any) {
      setLockError(err.message || 'Failed to set timelock');
    } finally {
      setLockLoading(false);
    }
  };

  if (!wallet) {
    return (
      <div>
        <h2><FiArrowUpCircle size={18} /> Withdraw</h2>
        <p className="hint-text">Connect your wallet to manage withdrawals.</p>
      </div>
    );
  }

  const balance = userVault?.balance ?? 0;

  return (
    <div className="withdraw-panel">
      {/* Withdraw section */}
      <div>
        <h2><FiArrowUpCircle size={18} /> Withdraw XLM</h2>

        <div className="vault-balance-bar">
          <span>Available: <strong>{formatXLM(balance)} XLM</strong></span>
          {isLocked && (
            <span className="lock-badge">
              <FiLock size={12} /> Locked — {timeUntil(userVault!.timelock)}
            </span>
          )}
        </div>

        {error && (
          <div className={`error ${
            error.type === AppErrorType.FUNDS_TIMELOCKED ? 'error-warning' :
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
              <p><strong>Withdrawal Successful!</strong></p>
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
              Withdraw Again
            </button>
          </div>
        ) : (
          <form onSubmit={handleWithdraw}>
            <div className="form-group">
              <label htmlFor="withdraw-amount">Amount (XLM)</label>
              <input
                id="withdraw-amount"
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="e.g. 5.00"
                required
                disabled={loading || isLocked}
              />
            </div>
            <button className="btn btn-danger" type="submit" disabled={loading || !amount || isLocked}>
              <FiArrowUpCircle size={15} /> {loading ? 'Processing...' : isLocked ? 'Funds Locked' : 'Withdraw'}
            </button>
          </form>
        )}
      </div>

      {/* Timelock section */}
      <div className="lock-section">
        <h3><FiClock size={16} /> Set Timelock</h3>
        <p className="hint-text">Lock your funds for a set number of days. You won't be able to withdraw until the lock expires.</p>

        {lockError && <div className="error">{lockError}</div>}

        {lockResult ? (
          <div className="success-box">
            <FiCheckCircle size={18} />
            <div>
              <p>Timelock set!</p>
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${lockResult}`}
                target="_blank"
                rel="noreferrer"
                className="tx-link"
              >
                <FiExternalLink size={12} /> View tx
              </a>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSetLock}>
            <div className="form-group">
              <label htmlFor="lock-days">Lock Duration (days)</label>
              <input
                id="lock-days"
                type="number"
                step="1"
                min="1"
                value={lockDays}
                onChange={(e) => setLockDays(e.target.value)}
                placeholder="e.g. 7"
                required
                disabled={lockLoading}
              />
            </div>
            <button className="btn btn-lock" type="submit" disabled={lockLoading || !lockDays}>
              <FiLock size={14} /> {lockLoading ? 'Setting...' : 'Lock Funds'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
};

export default WithdrawPanel;
