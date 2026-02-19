import { privateKeyToAccount } from 'viem/accounts';
import { createPublicClient, createWalletClient, http, WalletClient, PublicClient } from 'viem';
import { StorageHubClient } from '@storagehub-sdk/core';
import { ApiPromise, WsProvider } from '@polkadot/api';
import { types } from '@storagehub/types-bundle';
import { NETWORK, chain } from '../config/networks.js';

// Create Viem clients
const account = privateKeyToAccount('INSERT_PRIVATE_KEY' as `0x${string}`);
const address = account.address;

// Create wallet client for signing transactions
const walletClient: WalletClient = createWalletClient({
  chain,
  account,
  transport: http(NETWORK.rpcUrl),
});

// Create public client for read-only operations
const publicClient: PublicClient = createPublicClient({
  chain,
  transport: http(NETWORK.rpcUrl),
});

// Create StorageHub client
const storageHubClient: StorageHubClient = new StorageHubClient({
  rpcUrl: NETWORK.rpcUrl,
  chain: chain,
  walletClient: walletClient,
  filesystemContractAddress: NETWORK.filesystemContractAddress,
});

// Create Polkadot API client
const provider = new WsProvider(NETWORK.wsUrl);
const polkadotApi: ApiPromise = await ApiPromise.create({
  provider,
  typesBundle: types,
  noInitWarn: true,
});

export { account, address, publicClient, walletClient, storageHubClient, polkadotApi };
