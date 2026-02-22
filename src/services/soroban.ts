import * as StellarSdk from '@stellar/stellar-sdk';
import { NETWORK } from '../config/network';

let rpcServer: StellarSdk.SorobanRpc.Server | null = null;

export function getSorobanServer(): StellarSdk.SorobanRpc.Server {
  if (!rpcServer) {
    rpcServer = new StellarSdk.SorobanRpc.Server(NETWORK.sorobanUrl);
  }
  return rpcServer;
}

export function getHorizonServer(): StellarSdk.Horizon.Server {
  return new StellarSdk.Horizon.Server(NETWORK.url);
}
