import { Module } from '@nestjs/common';
import { TextController } from './text.controller';
import { TextService } from './text.service';

@Module({
  imports: [],
  controllers: [TextController],
  providers: [TextService],
})
export class TextModule {}
