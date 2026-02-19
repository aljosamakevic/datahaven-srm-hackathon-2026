import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { createBucket, verifyBucketCreation, waitForBackendBucketReady } from './operations/bucketOperations.js';
import { HealthStatus } from '@storagehub-sdk/msp-client';
import { mspClient } from './services/mspService.js';

async function run() {
  // For anything from @storagehub-sdk/core to work, initWasm() is required
  // on top of the file
  await initWasm();

  // --- Bucket creating logic ---

  // Check MSP Health Status
  const mspHealth: HealthStatus = await mspClient.info.getHealth();
  console.log('MSP Health Status:', mspHealth);

  // Create a bucket
  const bucketName = 'init-bucket-hackathon';
  const { bucketId, txReceipt } = await createBucket(bucketName);
  console.log(`Created Bucket ID: ${bucketId}`);
  console.log(`createBucket() txReceipt: ${txReceipt}`);

  // Verify bucket exists on chain
  const bucketData = await verifyBucketCreation(bucketId);
  console.log('Bucket data:', bucketData);

  // Wait until indexer/backend knows about the bucket
  await waitForBackendBucketReady(bucketId);

  // Disconnect the Polkadot API at the very end
  await polkadotApi.disconnect();
}

await run();
