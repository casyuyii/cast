import { Module } from '@nestjs/common';
import { MongoDBService } from '@/lib/mongo/mongo.service';

@Module({
  providers: [MongoDBService],
  exports: [MongoDBService],
})
export class MongoModule {}
