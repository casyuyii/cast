import { Module } from '@nestjs/common';
import { TextController } from '@/api/text/text.controller';
import { TextService } from '@/api/text/text.service';

@Module({
  imports: [],
  controllers: [TextController],
  providers: [TextService],
})
export class TextModule {}
