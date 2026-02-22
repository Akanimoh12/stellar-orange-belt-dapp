import {
  StellarWalletsKit,
  WalletNetwork,
  allowAllModules,
  FREIGHTER_ID,
  XBULL_ID,
} from '@creit.tech/stellar-wallets-kit';
import { NETWORK } from '../config/network';

let kitInstance: StellarWalletsKit | null = null;

export function getWalletKit(): StellarWalletsKit {
  if (!kitInstance) {
    kitInstance = new StellarWalletsKit({
      network: WalletNetwork.TESTNET,
      selectedWalletId: FREIGHTER_ID,
      modules: allowAllModules(),
    });
  }
  return kitInstance;
}

export function selectWallet(walletId: string): void {
  const kit = getWalletKit();
  kit.setWallet(walletId);
}

export async function connectKit(): Promise<string> {
  const kit = getWalletKit();
  const { address } = await kit.getAddress();
  return address;
}

export async function signWithKit(
  xdr: string,
  publicKey: string,
  _network: string
): Promise<string> {
  const kit = getWalletKit();
  const { signedTxXdr } = await kit.signTransaction(xdr, {
    address: publicKey,
    networkPassphrase: NETWORK.passphrase,
  });
  return signedTxXdr;
}

export const WALLET_IDS = {
  freighter: FREIGHTER_ID,
  xbull: XBULL_ID,
  albedo: 'albedo',
} as const;
