# DataHaven Storage — SH SDK Workshop

A hands-on workshop repo demonstrating the **StorageHub (SH) SDK** for decentralized storage on the DataHaven network. Each script walks through a core storage operation — creating buckets, uploading/downloading files, managing privacy, and cleanup — so you can see the full lifecycle in action.

## Architecture Overview

DataHaven storage operates across **two layers**:

| Layer | What lives here | Library |
|-------|----------------|---------|
| **On-chain** | Bucket metadata, storage requests, file keys, permissions | `@storagehub-sdk/core` + `viem` + `@polkadot/api` |
| **Off-chain** | Actual file data, served by a Main Storage Provider (MSP) | `@storagehub-sdk/msp-client` |

Every write operation (create bucket, upload file, delete) is first recorded on-chain as a transaction, then the MSP backend indexes it and serves the data. The scripts poll until both layers are in sync.

## Project Structure

```
src/
├── config/
│   └── networks.ts              # Network definitions (devnet / testnet)
├── services/
│   ├── clientService.ts         # Wallet, public, StorageHub & Polkadot clients
│   └── mspService.ts            # MSP backend client + SIWE auth
├── operations/
│   ├── bucketOperations.ts      # Create, verify, delete buckets & privacy
│   └── fileOperations.ts        # Upload, download, verify & delete files
├── abi/
│   └── FileSystemABI.json       # FileSystem precompile contract ABI
├── files/
│   └── bruce-the-moose.png      # Sample file for upload demos
├── index.ts                     # Blank starter template
├── create-bucket.ts             # Demo: create a bucket
├── end-to-end.ts                # Demo: full upload → download flow
├── file-manipulation.ts         # Demo: step-by-step storage request
├── delete-file.ts               # Demo: delete a file from a bucket
├── delete-bucket.ts             # Demo: delete an empty bucket
└── update-bucket-privacy.ts     # Demo: toggle bucket privacy
```

## Prerequisites

- **Node.js** v20+
- **pnpm** (package manager)
- A funded testnet wallet (get tokens from the dashboard)

## Setup

```bash
# 1. Clone the repo
git clone <repo-url>
cd datahaven-srm-hackathon-2026

# 2. Install dependencies
pnpm install

# 3. Create your .env file with a funded private key
echo 'PRIVATE_KEY=0xYOUR_PRIVATE_KEY_HERE' > .env
```

## Running the Scripts

Each script is a standalone demo you can run with `tsx`:

```bash
# Blank template — start here to write your own logic
pnpm tsx src/index.ts

# Create a storage bucket
pnpm tsx src/create-bucket.ts

# Full end-to-end: create bucket → upload file → download → verify
pnpm tsx src/end-to-end.ts

# Step-by-step file manipulation (issue storage request, compute file key)
pnpm tsx src/file-manipulation.ts

# Delete a file (update bucketId/fileKey in the script first)
pnpm tsx src/delete-file.ts

# Delete an empty bucket (update bucketId in the script first)
pnpm tsx src/delete-bucket.ts

# Update bucket privacy (update bucketId in the script first)
pnpm tsx src/update-bucket-privacy.ts
```

## Resources

| Resource | Link |
|----------|------|
| Dashboard (testnet tokens) | [dashboard.datahaven.xyz](https://dashboard.datahaven.xyz) |
| Testnet State | [datahaven.app](https://datahaven.app) |
| Documentation | [docs.datahaven.xyz](https://docs.datahaven.xyz) |
| Block Explorer | [testnet.dhscan.io](https://testnet.dhscan.io/) |

### Demo Dapps & Repositories

| Demo | Live | Source |
|------|------|--------|
| SDK Demo | [demosdk.datahaven.xyz](https://demosdk.datahaven.xyz/) | [GitHub](https://github.com/papermoonio/datahaven-demo-dapp) |
| NFT Demo | [demonft.datahaven.xyz](https://demonft.datahaven.xyz/) | [GitHub](https://github.com/papermoonio/datahaven-nft-demo-dapp) |
| End-to-End Storage Workflow | — | [GitHub](https://github.com/datahaven-xyz/datahaven-end-to-end-storage-workflow) |

## Key Concepts

- **Bucket** — A named container for files, owned by a wallet address. Created on-chain, then indexed by the MSP.
- **MSP (Main Storage Provider)** — The off-chain backend that stores and serves your actual file data.
- **Storage Request** — An on-chain transaction that tells the network you want to store a file. The MSP picks it up and stores the blob.
- **File Key** — A unique identifier for a file, derived from the owner address, bucket ID, and file name.
- **SIWE (Sign-In With Ethereum)** — Authentication method used to prove wallet ownership to the MSP backend.
- **Value Proposition** — An MSP's advertised storage terms (pricing, capacity). You select one when creating a bucket.
- **FileSystem Precompile** — A smart contract at a fixed address that exposes storage operations (bucket CRUD, storage requests) as EVM calls.
