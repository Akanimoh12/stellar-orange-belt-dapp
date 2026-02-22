import { useState, useCallback, useEffect } from 'react';
import { getVaultInfo, getUserVault } from '../services/contract';
import { VaultInfo, UserVault, AppError, AppErrorType } from '../types';

export function useVault(publicKey: string | null) {
  const [vaultInfo, setVaultInfo] = useState<VaultInfo | null>(null);
  const [userVault, setUserVault] = useState<UserVault | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const info = await getVaultInfo();
      setVaultInfo(info);

      if (publicKey) {
        const uv = await getUserVault(publicKey);
        setUserVault(uv);
      }
    } catch (err: any) {
      setError(
        err.type
          ? (err as AppError)
          : { type: AppErrorType.NETWORK_ERROR, message: err.message || 'Failed to load vault' }
      );
    } finally {
      setLoading(false);
    }
  }, [publicKey]);

  // Auto-fetch on mount & when publicKey changes
  useEffect(() => {
    fetch();
  }, [fetch]);

  const isLocked = userVault
    ? userVault.timelock > 0 && userVault.timelock > Math.floor(Date.now() / 1000)
    : false;

  return { vaultInfo, userVault, loading, error, refetch: fetch, isLocked };
}
