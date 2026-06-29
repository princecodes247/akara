import { Queue, Worker, QueueEvents } from "bullmq";
import Redis from "ioredis";

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
export const connection = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
});

// Queue for Asset Transfers
export const assetTransferQueue = new Queue("assetTransfer", { connection });

// Queue for Periodic Release Sync
export const releaseSyncQueue = new Queue("releaseSync", { connection });

// Initialize workers
export function initWorkers() {
  const assetWorker = new Worker("assetTransfer", async (job) => {
    console.log(`[AssetTransferWorker] Processing job ${job.id}:`, job.data);
    // TODO: implement asset transfer logic
  }, { connection });

  assetWorker.on('completed', job => {
    console.log(`[AssetTransferWorker] Job ${job.id} has completed!`);
  });
  
  assetWorker.on('failed', (job, err) => {
    console.log(`[AssetTransferWorker] Job ${job?.id} has failed with ${err.message}`);
  });

  const syncWorker = new Worker("releaseSync", async (job) => {
    console.log(`[ReleaseSyncWorker] Processing job ${job.id}:`, job.data);
    // TODO: implement release sync logic
  }, { connection });
  
  syncWorker.on('completed', job => {
    console.log(`[ReleaseSyncWorker] Job ${job.id} has completed!`);
  });

  syncWorker.on('failed', (job, err) => {
    console.log(`[ReleaseSyncWorker] Job ${job?.id} has failed with ${err.message}`);
  });

  console.log("Background workers initialized.");
}

// Helper to schedule periodic sync
export async function scheduleReleaseSync() {
  // Add a repeatable job
  await releaseSyncQueue.add("sync-all", {}, {
    repeat: {
      pattern: '0 * * * *', // every hour
    }
  });
  console.log("Release sync job scheduled.");
}
