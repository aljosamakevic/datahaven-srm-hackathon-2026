import '@storagehub/api-augment';
import { initWasm } from '@storagehub-sdk/core';
import { polkadotApi } from './services/clientService.js';
import { verifyBucketCreation, updateBucketPrivacy } from './operations/bucketOperations.js';

async function run() {
  await initWasm();

  const bucketId = '0xbb8ae6defce53e70d1b4b9cb1bcb25253fe35c5f515e294fd38c1330898c9f03';

  // 1. Update bucket privacy to private
  await updateBucketPrivacy(bucketId, true);

  // 2. Verify the privacy was updated on chain
  const bucketDataAfterPrivate = await verifyBucketCreation(bucketId);
  console.log('Bucket data after setting private:', bucketDataAfterPrivate);
  console.log(`Privacy after update: ${bucketDataAfterPrivate.private}\n`);

  await polkadotApi.disconnect();
}

run();
