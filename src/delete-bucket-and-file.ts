import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { authenticateUser } from './services/mspService.js';
import { getBucketFilesFromMSP, requestDeleteFile } from './operations/fileOperations.js';
import { deleteBucket, getBucketsFromMSP, waitForBackendBucketEmpty } from './operations/bucketOperations.js';

async function run() {
  // Initialize WASM
  await initWasm();

  const bucketId = 'INSERT_BUCKET_ID'; // `0x${string}`
  const fileKey = 'INSERT_FILE_KEY'; // `0x${string}`
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

  // Delete bucket
  const isBucketDeletionSuccessful = await deleteBucket(bucketId);
  console.log('Bucket deletion successful:', isBucketDeletionSuccessful);

  await polkadotApi.disconnect();
}

run();
