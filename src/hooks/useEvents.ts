import { useState, useEffect, useCallback, useRef } from 'react';
import { pollVaultEvents } from '../services/events';
import { VaultEvent } from '../types';

export function useEvents() {
  const [events, setEvents] = useState<VaultEvent[]>([]);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const ledgerRef = useRef<number | undefined>(undefined);

  const poll = useCallback(async () => {
    try {
      const { events: newEvents, latestLedger } = await pollVaultEvents(
        ledgerRef.current
      );
      ledgerRef.current = latestLedger + 1;
      if (newEvents.length > 0) {
        setEvents((prev) => [...newEvents, ...prev].slice(0, 50));
      }
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Event polling failed');
    }
  }, []);

  const start = useCallback(() => {
    if (intervalRef.current) return;
    setListening(true);
    poll(); // immediate first poll
    intervalRef.current = setInterval(poll, 8000);
  }, [poll]);

  const stop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setListening(false);
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return { events, listening, error, start, stop };
}
