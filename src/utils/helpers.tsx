import React from 'react';

// ─── Utility functions ──────────────────────────────────────────────────
// Exported so they can be unit-tested (Orange Belt requirement)

export function formatXLM(stroops: number): string {
  return (stroops / 10_000_000).toFixed(2);
}

export function truncateAddress(addr: string, chars = 6): string {
  if (!addr || addr.length <= chars * 2) return addr || '';
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function isValidAmount(value: string): boolean {
  if (!value || value.trim() === '') return false;
  const num = Number(value);
  return !isNaN(num) && num > 0 && isFinite(num);
}

export function timeUntil(unixTimestamp: number): string {
  const now = Math.floor(Date.now() / 1000);
  const diff = unixTimestamp - now;
  if (diff <= 0) return 'Unlocked';
  const days = Math.floor(diff / 86400);
  const hours = Math.floor((diff % 86400) / 3600);
  const mins = Math.floor((diff % 3600) / 60);
  if (days > 0) return `${days}d ${hours}h`;
  if (hours > 0) return `${hours}h ${mins}m`;
  return `${mins}m`;
}

export function formatDate(unixTimestamp: number): string {
  if (!unixTimestamp) return '—';
  return new Date(unixTimestamp * 1000).toLocaleString();
}

// ─── Loading Spinner component ──────────────────────────────────────────
interface SpinnerProps {
  size?: number;
  text?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 18, text }) => (
  <span className="spinner-wrap">
    <span className="spinner" style={{ width: size, height: size }} />
    {text && <span className="spinner-text">{text}</span>}
  </span>
);

// ─── Skeleton loader for cards ──────────────────────────────────────────
export const Skeleton: React.FC<{ width?: string; height?: string }> = ({
  width = '100%',
  height = '1rem',
}) => <div className="skeleton" style={{ width, height }} />;

// ─── Transaction progress indicator ────────────────────────────────────
interface TxProgressProps {
  stage: 'idle' | 'submitting' | 'confirming' | 'done' | 'error';
  text?: string;
}

export const TxProgress: React.FC<TxProgressProps> = ({ stage, text }) => {
  if (stage === 'idle') return null;

  const stages = ['submitting', 'confirming', 'done'];
  const idx = stages.indexOf(stage);
  const pct = stage === 'error' ? 100 : stage === 'done' ? 100 : ((idx + 1) / stages.length) * 80;

  return (
    <div className={`tx-progress ${stage === 'error' ? 'tx-progress-error' : ''}`}>
      <div className="tx-progress-bar">
        <div
          className="tx-progress-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <span className="tx-progress-label">
        {text || (stage === 'submitting' ? 'Submitting transaction...' :
          stage === 'confirming' ? 'Confirming on-chain...' :
          stage === 'done' ? 'Complete!' :
          'Transaction failed')}
      </span>
    </div>
  );
};
