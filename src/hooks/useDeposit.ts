import { useState, useCallback } from 'react';
import { deposit } from '../services/contract';
import { AppError, AppErrorType, TransactionResult } from '../types';

export function useDeposit() {
  const [result, setResult] = useState<TransactionResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<AppError | null>(null);

  const submitDeposit = useCallback(async (publicKey: string, amount: number) => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const hash = await deposit(publicKey, amount);
      setResult({ success: true, hash });
    } catch (err: any) {
      if (err.type) {
        setError(err as AppError);
      } else {
        setError({
          type: AppErrorType.CONTRACT_ERROR,
          message: err.message || 'Deposit failed',
        });
      }
      setResult({ success: false, error: err.message });
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return { submitDeposit, result, loading, error, reset };
}
