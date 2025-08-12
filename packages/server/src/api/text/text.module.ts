import { Module } from '@nestjs/common';
import { TextController } from '@/api/text/text.controller';
import { TextService } from '@/api/text/text.service';
import { MongoDBService } from '@/lib/mongo.service';

@Module({
  imports: [],
  controllers: [TextController],
  providers: [TextService, MongoDBService],
})
export class TextModule {}
