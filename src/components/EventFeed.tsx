import React from 'react';
import { FiActivity, FiPlay, FiSquare } from 'react-icons/fi';
import { useEvents } from '../hooks/useEvents';
import { formatXLM, truncateAddress } from '../utils/helpers';

const EventFeed: React.FC = () => {
  const { events, listening, error, start, stop } = useEvents();

  return (
    <div>
      <h2><FiActivity size={18} /> Vault Activity</h2>

      <div className="event-controls">
        {listening ? (
          <>
            <button className="btn btn-sm btn-danger" onClick={stop}>
              <FiSquare size={13} /> Stop
            </button>
            <span className="pulse-dot" />
            <span className="listening-text">Listening for events...</span>
          </>
        ) : (
          <button className="btn btn-sm" onClick={start}>
            <FiPlay size={13} /> Start Listening
          </button>
        )}
      </div>

      {error && <div className="error">{error}</div>}

      {events.length === 0 ? (
        <p className="hint-text">
          {listening ? 'Waiting for events...' : 'Click "Start Listening" to watch vault activity.'}
        </p>
      ) : (
        <div className="event-list">
          {events.map((evt, i) => (
            <div key={`${evt.txHash}-${i}`} className={`event-item event-${evt.type}`}>
              <div className="event-header">
                <span className={`event-badge event-badge-${evt.type}`}>
                  {evt.type === 'deposit' ? '↓ Deposit' : evt.type === 'withdraw' ? '↑ Withdraw' : '🔒 Lock'}
                </span>
                <span className="event-time">
                  {new Date(evt.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <div className="event-details">
                <span className="event-user">{truncateAddress(evt.user, 8)}</span>
                {evt.amount !== undefined && (
                  <span className="event-amount">{formatXLM(evt.amount)} XLM</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default EventFeed;
