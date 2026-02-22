import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { authenticateUser } from './services/mspService.js';
import { deleteBucket, getBucketFromMSP } from './operations/bucketOperations.js';

async function run() {
  // Initialize WASM
  await initWasm();

  const bucketId = '0xb03fd846131364618b5b66c60b49f2cf1f044c30a9720dca22cc6e8956ac0816'; // `0x${string}`
  // If not in hex already, convert it with .toHex()

  // Authenticate
  const authProfile = await authenticateUser();
  console.log('Authenticated user profile:', authProfile);

  // Get bucket from MSP
  const bucket = await getBucketFromMSP(bucketId);
  console.log('Bucket:', bucket);

  if (!bucket) {
    throw new Error(`Bucket not found: ${bucketId}`);
  }

  // Delete bucket
  if (bucket.fileCount === 0) {
    const isBucketDeletionSuccessful = await deleteBucket(bucketId);
    console.log('Bucket deletion successful:', isBucketDeletionSuccessful);
  }

  await polkadotApi.disconnect();
}

run();
