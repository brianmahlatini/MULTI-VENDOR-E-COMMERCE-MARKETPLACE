import { env } from "./config/env.js";
import { logger } from "./config/logger.js";
import { connectMongo } from "./db/mongo.js";
import { prisma } from "./db/postgres.js";
import { app } from "./app.js";

async function main() {
  await prisma.$connect();
  await connectMongo();

  app.listen(env.PORT, () => {
    logger.info(`Marketplace API running on port ${env.PORT}`);
  });
}

main().catch((error) => {
  logger.error(error, "Failed to start API");
  process.exit(1);
});
