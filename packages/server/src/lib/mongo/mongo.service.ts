import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { MongoClient, Db } from 'mongodb';

@Injectable()
export class MongoDBService implements OnModuleInit, OnModuleDestroy {
  private client: MongoClient;
  private textDb: Db;

  constructor() {}

  async onModuleInit() {
    const uri = process.env.MONGO_URI;
    if (!uri) {
      throw new Error('MONGO_URI is not set');
    }

    this.client = new MongoClient(uri);
    await this.client.connect();
    this.textDb = this.client.db('text');

    console.log(`✅ Connected to MongoDB`);
  }

  async onModuleDestroy() {
    await this.client.close();
    console.log(`❌ Disconnected from MongoDB`);
  }

  getTextDb(): Db {
    return this.textDb;
  }
}
