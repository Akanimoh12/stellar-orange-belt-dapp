import * as StellarSdk from '@stellar/stellar-sdk';
import { getSorobanServer } from './soroban';
import { cache } from './cache';
import { NETWORK, CONTRACT_ID, VAULT_ADMIN } from '../config/network';
import { VaultInfo, UserVault, AppError, AppErrorType } from '../types';

// ─── Dynamic import for wallet signing ──────────────────────────────────
async function loadSignWithKit() {
  const { signWithKit } = await import('../wallet/kit');
  return signWithKit;
}

const {
  Contract,
  TransactionBuilder,
  Networks,
  Address,
  nativeToScVal,
  scValToNative,
} = StellarSdk;

// ─── Helpers ────────────────────────────────────────────────────────────
function err(type: AppErrorType, message: string, details?: string): AppError {
  return { type, message, details };
}

function getContract(): StellarSdk.Contract {
  return new Contract(CONTRACT_ID);
}

/**
 * Build, simulate, sign & submit a Soroban transaction.
 * Returns the tx hash on success.
 */
async function buildAndSendTx(
  publicKey: string,
  operation: StellarSdk.xdr.Operation
): Promise<string> {
  const server = getSorobanServer();

  let account;
  try {
    account = await server.getAccount(publicKey);
  } catch {
    throw err(
      AppErrorType.INSUFFICIENT_BALANCE,
      'Account not found or not funded on testnet. Use Friendbot first.'
    );
  }

  let tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(operation)
    .setTimeout(60)
    .build();

  // Simulate
  const simulated = await server.simulateTransaction(tx);
  if (StellarSdk.SorobanRpc.Api.isSimulationError(simulated)) {
    const errMsg = (simulated as any).error || 'Simulation failed';
    if (errMsg.includes('timelocked')) {
      throw err(AppErrorType.FUNDS_TIMELOCKED, 'Your funds are still timelocked.');
    }
    if (errMsg.includes('insufficient vault balance')) {
      throw err(AppErrorType.INSUFFICIENT_BALANCE, 'You have insufficient vault balance.');
    }
    throw err(AppErrorType.CONTRACT_ERROR, errMsg);
  }

  tx = StellarSdk.SorobanRpc.assembleTransaction(tx, simulated).build();

  // Sign via wallet kit
  let signedXdr: string;
  try {
    const signWithKit = await loadSignWithKit();
    signedXdr = await signWithKit(tx.toXDR(), publicKey, NETWORK.passphrase);
  } catch (e: any) {
    const msg = e?.message || '';
    if (
      msg.includes('User declined') ||
      msg.includes('rejected') ||
      msg.includes('cancel') ||
      msg.includes('denied')
    ) {
      throw err(AppErrorType.TRANSACTION_REJECTED, 'You rejected the transaction in your wallet.');
    }
    throw err(AppErrorType.TRANSACTION_REJECTED, msg || 'Wallet signing failed');
  }

  const signedTx = TransactionBuilder.fromXDR(signedXdr, Networks.TESTNET);
  const response = await server.sendTransaction(signedTx as StellarSdk.Transaction);

  if (response.status === 'ERROR') {
    throw err(AppErrorType.CONTRACT_ERROR, 'Transaction submission failed');
  }

  // Poll for result — wrap in try/catch for SDK parse issues ("Bad union switch")
  try {
    let result = await server.getTransaction(response.hash);
    let retries = 0;
    while (result.status === 'NOT_FOUND' && retries < 30) {
      await new Promise((r) => setTimeout(r, 2000));
      result = await server.getTransaction(response.hash);
      retries++;
    }
    if (result.status === 'FAILED') {
      throw err(AppErrorType.CONTRACT_ERROR, 'Transaction failed on-chain.');
    }
  } catch (pollErr: any) {
    if (pollErr?.type) throw pollErr; // re-throw AppErrors
    console.warn('[Vault] getTransaction parse warning:', pollErr?.message);
  }

  return response.hash;
}

// ─── Read-only helpers ──────────────────────────────────────────────────

export async function getVaultInfo(): Promise<VaultInfo> {
  // Check cache first
  const cached = cache.get<VaultInfo>('vault_info');
  if (cached) return cached;

  const server = getSorobanServer();
  const contract = getContract();
  const account = await server.getAccount(VAULT_ADMIN);

  const tx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call('get_vault_info'))
    .setTimeout(30)
    .build();

  const simulated = await server.simulateTransaction(tx);
  if (StellarSdk.SorobanRpc.Api.isSimulationError(simulated)) {
    throw err(AppErrorType.CONTRACT_ERROR, 'Failed to read vault info');
  }

  const successSim =
    simulated as StellarSdk.SorobanRpc.Api.SimulateTransactionSuccessResponse;
  if (!successSim.result) throw err(AppErrorType.CONTRACT_ERROR, 'No result');

  const raw = scValToNative(successSim.result.retval);
  const data: VaultInfo = {
    admin: raw.admin?.toString() || '',
    token: raw.token?.toString() || '',
    totalDeposited: Number(raw.total_deposited || 0),
    depositCount: Number(raw.deposit_count || 0),
  };

  cache.set('vault_info', data, 20_000); // cache 20s
  return data;
}

export async function getUserVault(publicKey: string): Promise<UserVault> {
  const cacheKey = `user_${publicKey.slice(0, 8)}`;
  const cached = cache.get<UserVault>(cacheKey);
  if (cached) return cached;

  const server = getSorobanServer();
  const contract = getContract();
  const account = await server.getAccount(VAULT_ADMIN);

  // get_balance
  const balTx = new TransactionBuilder(account, {
    fee: '100000',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call('get_balance', new Address(publicKey).toScVal()))
    .setTimeout(30)
    .build();

  let balance = 0;
  const balSim = await server.simulateTransaction(balTx);
  if (!StellarSdk.SorobanRpc.Api.isSimulationError(balSim)) {
    const s = balSim as StellarSdk.SorobanRpc.Api.SimulateTransactionSuccessResponse;
    if (s.result) balance = Number(scValToNative(s.result.retval));
  }

  // get_timelock — need a fresh account sequence
  const account2 = await server.getAccount(VAULT_ADMIN);
  const lockTx = new TransactionBuilder(account2, {
    fee: '100000',
    networkPassphrase: Networks.TESTNET,
  })
    .addOperation(contract.call('get_timelock', new Address(publicKey).toScVal()))
    .setTimeout(30)
    .build();

  let timelock = 0;
  const lockSim = await server.simulateTransaction(lockTx);
  if (!StellarSdk.SorobanRpc.Api.isSimulationError(lockSim)) {
    const s = lockSim as StellarSdk.SorobanRpc.Api.SimulateTransactionSuccessResponse;
    if (s.result) timelock = Number(scValToNative(s.result.retval));
  }

  const data: UserVault = { balance, timelock };
  cache.set(cacheKey, data, 15_000); // cache 15s
  return data;
}

// ─── Write operations ───────────────────────────────────────────────────

export async function deposit(publicKey: string, amount: number): Promise<string> {
  if (amount <= 0) throw err(AppErrorType.CONTRACT_ERROR, 'Amount must be > 0');

  const contract = getContract();
  const op = contract.call(
    'deposit',
    new Address(publicKey).toScVal(),
    nativeToScVal(amount, { type: 'i128' })
  );

  const hash = await buildAndSendTx(publicKey, op);

  // Invalidate caches after mutation
  cache.invalidate('vault_info');
  cache.invalidate(`user_${publicKey.slice(0, 8)}`);

  return hash;
}

export async function withdraw(publicKey: string, amount: number): Promise<string> {
  if (amount <= 0) throw err(AppErrorType.CONTRACT_ERROR, 'Amount must be > 0');

  const contract = getContract();
  const op = contract.call(
    'withdraw',
    new Address(publicKey).toScVal(),
    nativeToScVal(amount, { type: 'i128' })
  );

  const hash = await buildAndSendTx(publicKey, op);

  cache.invalidate('vault_info');
  cache.invalidate(`user_${publicKey.slice(0, 8)}`);

  return hash;
}

export async function setTimelock(publicKey: string, unlockTime: number): Promise<string> {
  const contract = getContract();
  const op = contract.call(
    'set_timelock',
    new Address(publicKey).toScVal(),
    nativeToScVal(unlockTime, { type: 'u64' })
  );

  const hash = await buildAndSendTx(publicKey, op);

  cache.invalidate(`user_${publicKey.slice(0, 8)}`);

  return hash;
}
