import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from "@nestjs/common"
import { MongoClient, Db } from "mongodb"

@Injectable()
export class MongoService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(MongoService.name)
  private client: MongoClient
  private textDb: Db

  onModuleInit() {
    const uri = process.env.MONGO_URI
    if (!uri) {
      throw new Error("MONGO_URI is not set")
    }

    // Don't block startup on the DB: the driver connects lazily and reconnects on its own,
    // so the API can answer 503 while MongoDB is down instead of the server failing to boot.
    this.client = new MongoClient(uri, { serverSelectionTimeoutMS: 5000 })
    this.textDb = this.client.db("text")

    this.client
      .connect()
      .then(() => this.logger.log(`✅ Connected to MongoDB ${uri}`))
      .catch((err: Error) => this.logger.warn(`MongoDB not reachable yet: ${err.message}`))
  }

  async onModuleDestroy() {
    await this.client.close()
    this.logger.log(`❌ Disconnected from MongoDB`)
  }

  getTextDb(): Db {
    return this.textDb
  }
}
