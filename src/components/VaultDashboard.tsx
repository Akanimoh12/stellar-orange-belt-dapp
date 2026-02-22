import React from 'react';
import { FiLock, FiUnlock, FiUsers, FiDatabase, FiRefreshCw, FiClock } from 'react-icons/fi';
import { useWallet } from '../hooks/useWallet';
import { useVault } from '../hooks/useVault';
import { formatXLM, truncateAddress, timeUntil, formatDate, Skeleton } from '../utils/helpers';

const VaultDashboard: React.FC = () => {
  const { wallet } = useWallet();
  const { vaultInfo, userVault, loading, error, refetch, isLocked } = useVault(
    wallet?.publicKey || null
  );

  return (
    <div>
      <div className="card-header-row">
        <h2><FiDatabase size={18} /> Vault Overview</h2>
        <button className="btn btn-sm btn-outline" onClick={refetch} style={{ marginLeft: 'auto' }}>
          <FiRefreshCw size={13} /> Refresh
        </button>
      </div>

      {error && (
        <div className="error">{error.message}</div>
      )}

      {/* Global stats */}
      <div className="vault-stats">
        <div className="stat-card">
          <div className="stat-icon"><FiDatabase size={20} /></div>
          {loading && !vaultInfo ? (
            <Skeleton width="60%" height="1.4rem" />
          ) : (
            <div className="stat-value">{vaultInfo ? formatXLM(vaultInfo.totalDeposited) : '0'}</div>
          )}
          <div className="stat-label">Total Deposited (XLM)</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><FiUsers size={20} /></div>
          {loading && !vaultInfo ? (
            <Skeleton width="40%" height="1.4rem" />
          ) : (
            <div className="stat-value">{vaultInfo?.depositCount ?? 0}</div>
          )}
          <div className="stat-label">Active Depositors</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">{isLocked ? <FiLock size={20} /> : <FiUnlock size={20} />}</div>
          {loading && !userVault ? (
            <Skeleton width="50%" height="1.4rem" />
          ) : (
            <div className="stat-value">
              {wallet
                ? isLocked
                  ? timeUntil(userVault!.timelock)
                  : 'Unlocked'
                : '—'}
            </div>
          )}
          <div className="stat-label">Your Lock Status</div>
        </div>
      </div>

      {/* Your vault section */}
      {wallet && (
        <div className="user-vault-card">
          <h3>Your Vault</h3>
          <div className="uv-row">
            <span className="uv-label">Balance:</span>
            {loading && !userVault ? (
              <Skeleton width="6rem" height="1rem" />
            ) : (
              <span className="uv-value">{formatXLM(userVault?.balance ?? 0)} XLM</span>
            )}
          </div>
          <div className="uv-row">
            <span className="uv-label">Timelock:</span>
            {loading && !userVault ? (
              <Skeleton width="8rem" height="1rem" />
            ) : (
              <span className="uv-value">
                {userVault && userVault.timelock > 0 ? (
                  <>
                    <FiClock size={13} />{' '}
                    {isLocked
                      ? `Locked until ${formatDate(userVault.timelock)} (${timeUntil(userVault.timelock)})`
                      : 'Expired — funds unlocked'}
                  </>
                ) : (
                  'No timelock set'
                )}
              </span>
            )}
          </div>
          <div className="uv-row">
            <span className="uv-label">Address:</span>
            <span className="uv-value uv-mono">{truncateAddress(wallet.publicKey, 10)}</span>
          </div>
        </div>
      )}

      {!wallet && (
        <p className="hint-text">Connect your wallet to view your personal vault.</p>
      )}

      {vaultInfo && (
        <div className="admin-info">
          <span>Vault Admin: </span>
          <code>{truncateAddress(vaultInfo.admin, 8)}</code>
        </div>
      )}
    </div>
  );
};

export default VaultDashboard;
