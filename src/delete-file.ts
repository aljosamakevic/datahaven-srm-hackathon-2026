import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { authenticateUser } from './services/mspService.js';
import { getBucketFilesFromMSP, requestDeleteFile } from './operations/fileOperations.js';
import { deleteBucket, getBucketsFromMSP, waitForBackendBucketEmpty } from './operations/bucketOperations.js';

async function run() {
  // Initialize WASM
  await initWasm();

  const bucketId = '0xb03fd846131364618b5b66c60b49f2cf1f044c30a9720dca22cc6e8956ac0816'; // `0x${string}`
  const fileKey = '0x3029d55a4d6be8ad68da5e5c274b6f37c63b3775b2f577ec65d920570532295e'; // `0x${string}`
  // If not in hex already, convert it with .toHex()

  // Authenticate
  const authProfile = await authenticateUser();
  console.log('Authenticated user profile:', authProfile);

  // Get buckets from MSP
  const buckets = await getBucketsFromMSP();
  console.log('Buckets in MSP:', buckets);

  // Get bucket files from MSP
  const files = await getBucketFilesFromMSP(bucketId);
  console.log(`Files in bucket with ID ${bucketId}:`);
  console.log(JSON.stringify(files, null, 2));

  // Request file deletion
  const isDeletionRequestSuccessful = await requestDeleteFile(bucketId, fileKey);
  console.log('File deletion request submitted successfully:', isDeletionRequestSuccessful);

  // Wait for backend to process deletion and verify bucket is empty
  await waitForBackendBucketEmpty(bucketId);

  await polkadotApi.disconnect();
}

run();
