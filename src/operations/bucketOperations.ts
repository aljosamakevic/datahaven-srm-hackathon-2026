import { NETWORK, chain } from '../config/networks.js';
import {
  storageHubClient,
  address,
  publicClient,
  polkadotApi,
  account,
  walletClient,
} from '../services/clientService.js';
import { getMspInfo, getValueProps, mspClient } from '../services/mspService.js';
import { Bucket, FileListResponse } from '@storagehub-sdk/msp-client';
import fileSystemAbi from '../abi/FileSystemABI.json' with { type: 'json' };

export async function createBucket(bucketName: string) {
  // Get basic MSP information from the MSP including its ID
  const { mspId } = await getMspInfo();

  // Choose one of the value props retrieved from the MSP through the helper function
  const valuePropId = await getValueProps();
  console.log(`Value Prop ID: ${valuePropId}`);

  // Derive bucket ID
  const bucketId = (await storageHubClient.deriveBucketId(address, bucketName)) as string;
  console.log(`Derived bucket ID: ${bucketId}`);

  // Check that the bucket doesn't exist yet
  const bucketBeforeCreation = await polkadotApi.query.providers.buckets(bucketId);
  console.log('Bucket before creation is empty', bucketBeforeCreation.isEmpty);
  if (!bucketBeforeCreation.isEmpty) {
    throw new Error(`Bucket already exists: ${bucketId}`);
  }

  const isPrivate = false;

  // Create bucket on chain
  const txHash: `0x${string}` | undefined = await storageHubClient.createBucket(
    mspId as `0x${string}`,
    bucketName,
    isPrivate,
    valuePropId
  );

  console.log('createBucket() txHash:', txHash);
  if (!txHash) {
    throw new Error('createBucket() did not return a transaction hash');
  }

  // Wait for transaction receipt
  // Don't proceed until receipt is confirmed on chain
  const txReceipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
  if (txReceipt.status !== 'success') {
    throw new Error(`Bucket creation failed: ${txHash}`);
  }

  return { bucketId, txReceipt };
}

// Verify bucket creation on chain and return bucket data
export async function verifyBucketCreation(bucketId: string) {
  const { mspId } = await getMspInfo();

  const bucket = await polkadotApi.query.providers.buckets(bucketId);
  if (bucket.isEmpty) {
    throw new Error('Bucket not found on chain after creation');
  }

  const bucketData = bucket.unwrap().toHuman();
  console.log('Bucket userId matches initial bucket owner address', bucketData.userId === address);
  console.log(`Bucket MSPId matches initial MSPId: ${bucketData.mspId === mspId}`);
  return bucketData;
}

// Wait until the backend/indexer has indexed the newly created bucket
export async function waitForBackendBucketReady(bucketId: string) {
  const maxAttempts = 10; // Number of polling attempts
  const delayMs = 2000; // Delay between attempts in milliseconds

  for (let i = 0; i < maxAttempts; i++) {
    console.log(`Checking for bucket in MSP backend, attempt ${i + 1} of ${maxAttempts}...`);
    try {
      // Query the MSP backend for the bucket metadata.
      // If the backend has synced the bucket, this call resolves successfully.
      const bucket = await mspClient.buckets.getBucket(bucketId);

      if (bucket) {
        // Bucket is now available and the script can safely continue
        console.log('Bucket found in MSP backend:', bucket);
        return;
      }
    } catch (error: any) {
      // Backend hasn’t indexed the bucket yet
      if (error.status === 404 || error.body.error === 'Not found: Record') {
        console.log(`Bucket not found in MSP backend yet (404).`);
      } else {
        // Any other error is unexpected and should fail the entire workflow
        console.log('Unexpected error while fetching bucket from MSP:', error);
        throw error;
      }
    }
    // Wait before polling again
    await new Promise((r) => setTimeout(r, delayMs));
  }
  // All attempts exhausted
  throw new Error(`Bucket ${bucketId} not found in MSP backend after waiting`);
}

export async function getBucketsFromMSP(): Promise<Bucket[]> {
  const buckets: Bucket[] = await mspClient.buckets.listBuckets();
  return buckets;
}

export async function waitForBackendBucketEmpty(bucketId: string) {
  const maxAttempts = 144; // 12 minutes total (144 * 5s)
  const delayMs = 5000;

  for (let i = 0; i < maxAttempts; i++) {
    try {
      const bucketFiles: FileListResponse = await mspClient.buckets.getFiles(bucketId);

      if (bucketFiles.files.length === 0) {
        console.log('Bucket is empty in MSP backend:', bucketFiles);
        return;
      }
      console.log(
        `Checking MSP backend for empty bucket... ${bucketFiles.files.length} file(s) remaining. ` +
          `Attempt ${i + 1}/${maxAttempts}`
      );
    } catch (error: any) {
      if (error.status === 404 || error.body.error === 'Not found: Record') {
        console.log(`Bucket not found in MSP backend (404).`);
        throw new Error(`Bucket ${bucketId} not found in MSP backend`);
      } else {
        console.log('Unexpected error while fetching bucket from MSP:', error);
        throw error;
      }
    }
    await new Promise((r) => setTimeout(r, delayMs));
  }
  throw new Error(`Bucket ${bucketId} not empty in MSP backend after waiting`);
}

export async function deleteBucket(bucketId: string): Promise<boolean> {
  const txHash: `0x${string}` | undefined = await storageHubClient.deleteBucket(bucketId as `0x${string}`);
  console.log('deleteBucket() txHash:', txHash);
  if (!txHash) {
    throw new Error('deleteBucket() did not return a transaction hash');
  }

  // Wait for transaction
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
  console.log('deleteBucket() txReceipt:', receipt);
  if (receipt.status !== 'success') {
    throw new Error(`Bucket deletion failed: ${txHash}`);
  }

  return true;
}

export async function updateBucketPrivacy(bucketId: string, isPrivate: boolean): Promise<boolean> {
  // Update bucket privacy on chain by calling the FileSystem precompile directly
  const txHash = await walletClient.writeContract({
    account,
    address: NETWORK.filesystemContractAddress,
    abi: fileSystemAbi,
    functionName: 'updateBucketPrivacy',
    args: [bucketId as `0x${string}`, isPrivate],
    chain: chain,
  });
  console.log('updateBucketPrivacy() txHash:', txHash);
  if (!txHash) {
    throw new Error('updateBucketPrivacy() did not return a transaction hash');
  }

  // Wait for transaction receipt
  const receipt = await publicClient.waitForTransactionReceipt({
    hash: txHash,
  });
  console.log('updateBucketPrivacy() txReceipt:', receipt);
  if (receipt.status !== 'success') {
    throw new Error(`Bucket privacy update failed: ${txHash}`);
  }

  console.log(`Bucket ${bucketId} privacy updated to ${isPrivate ? 'private' : 'public'}`);
  return true;
}
