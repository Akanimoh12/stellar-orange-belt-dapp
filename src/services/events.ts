import * as StellarSdk from '@stellar/stellar-sdk';
import { getSorobanServer } from './soroban';
import { CONTRACT_ID } from '../config/network';
import { VaultEvent } from '../types';

/**
 * Poll Soroban events for the vault contract.
 * Returns parsed deposit / withdraw / lock events.
 */
export async function pollVaultEvents(startLedger?: number): Promise<{
  events: VaultEvent[];
  latestLedger: number;
}> {
  const server = getSorobanServer();

  let ledger = startLedger;
  if (!ledger) {
    const latest = await server.getLatestLedger();
    ledger = latest.sequence - 1000; // last ~1 h
    if (ledger < 1) ledger = 1;
  }

  const response = await server.getEvents({
    startLedger: ledger,
    filters: [
      {
        type: 'contract',
        contractIds: [CONTRACT_ID],
      },
    ],
    limit: 50,
  });

  const events: VaultEvent[] = [];

  for (const evt of response.events || []) {
    try {
      const topic = evt.topic.map((t) => StellarSdk.scValToNative(t));
      const topicStr = topic[0]?.toString() || '';
      const data = StellarSdk.scValToNative(evt.value);

      if (topicStr === 'deposit' || topicStr === 'withdraw') {
        events.push({
          type: topicStr as 'deposit' | 'withdraw',
          user: Array.isArray(data) ? data[0]?.toString() || '' : '',
          amount: Array.isArray(data) ? Number(data[1] || 0) : 0,
          timestamp: Date.now(),
          txHash: evt.id,
        });
      } else if (topicStr === 'lock') {
        events.push({
          type: 'lock',
          user: Array.isArray(data) ? data[0]?.toString() || '' : '',
          unlockTime: Array.isArray(data) ? Number(data[1] || 0) : 0,
          timestamp: Date.now(),
          txHash: evt.id,
        });
      }
    } catch {
      // skip unparsable
    }
  }

  return {
    events,
    latestLedger: response.latestLedger || ledger,
  };
}
