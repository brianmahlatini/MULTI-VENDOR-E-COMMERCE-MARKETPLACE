import { Worker } from "bullmq";
import { logger } from "../config/logger.js";
import { redis } from "../db/redis.js";
import { prisma } from "../db/postgres.js";

new Worker(
  "orders",
  async (job) => {
    if (job.name === "process-paid-order") {
      const { orderId } = job.data as { orderId: string };
      await prisma.order.update({
        where: { id: orderId },
        data: {
          status: "PROCESSING",
          logs: {
            create: { event: "ORDER_PROCESSING_STARTED", metadata: { jobId: job.id } }
          }
        }
      });
    }
  },
  { connection: redis }
);

logger.info("Order worker started");
