import { Module } from "@nestjs/common"
import { MongoService } from "@/lib/mongo/mongo.service"

@Module({
  providers: [MongoService],
  exports: [MongoService],
})
export class MongoModule {}
