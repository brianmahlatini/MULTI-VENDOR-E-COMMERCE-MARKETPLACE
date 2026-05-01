import { Queue } from "bullmq";
import { redis } from "../db/redis.js";

export const orderQueue = new Queue("orders", {
  connection: redis
});
