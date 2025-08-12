import { Module } from '@nestjs/common';
import { TextController } from '@/api/text/text.controller';
import { TextService } from '@/api/text/text.service';
import { MongoModule } from '@/lib/mongo/mongo.module';

@Module({
  imports: [MongoModule],
  controllers: [TextController],
  providers: [TextService],
})
export class TextModule {}
