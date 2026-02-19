import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import {
  downloadFile,
  uploadFile,
  verifyDownload,
  waitForBackendFileReady,
  waitForMSPConfirmOnChain,
} from './operations/fileOperations.js';
import { HealthStatus } from '@storagehub-sdk/msp-client';
import { mspClient } from './services/mspService.js';
import { createBucket, verifyBucketCreation, waitForBackendBucketReady } from './operations/bucketOperations.js';

async function run() {
  // Initialize WASM
  await initWasm();

  console.log('🚀 Starting DataHaven Storage End-to-End Script...');

  // 1. Check MSP Health
  const mspHealth: HealthStatus = await mspClient.info.getHealth();
  console.log('MSP Health Status:', mspHealth);

  // 2. Create Bucket
  const bucketName = 'init-bucket';
  const { bucketId, txReceipt } = await createBucket(bucketName);
  console.log(`Created Bucket ID: ${bucketId}`);
  console.log(`createBucket() txReceipt: ${txReceipt}`);

  // 3. Verify bucket exists on chain
  const bucketData = await verifyBucketCreation(bucketId);
  console.log('Bucket data:', bucketData);

  // 4. Wait until indexer/backend knows about the bucket
  await waitForBackendBucketReady(bucketId);

  // 5. Upload file
  const fileName = 'bruce-the-moose.png';
  const filePath = new URL(`./files/${fileName}`, import.meta.url).pathname;

  const { fileKey, uploadReceipt } = await uploadFile(bucketId, filePath, fileName);
  console.log(`File uploaded: ${fileKey}`);
  console.log(`Status: ${uploadReceipt.status}`);

  // 6. Wait until indexer/backend knows about the file
  await waitForMSPConfirmOnChain(fileKey.toHex());
  await waitForBackendFileReady(bucketId, fileKey.toHex());

  // 7. Download file
  const downloadedFilePath = new URL('./files/bruce-the-moose-downloaded.png', import.meta.url).pathname;
  const downloadedFile = await downloadFile(fileKey, downloadedFilePath);
  console.log(`File type: ${downloadedFile.mime}`);
  console.log(`Downloaded ${downloadedFile.size} bytes to ${downloadedFile.path}`);

  // 8. Verify download integrity
  const isValid = await verifyDownload(filePath, downloadedFilePath);
  console.log(`File integrity verified: ${isValid ? 'PASSED' : 'FAILED'}`);

  console.log('🚀 DataHaven Storage End-to-End Script Completed Successfully.');

  await polkadotApi.disconnect();
}

run();
