import { Module } from '@nestjs/common';
import { TextModule } from './text/text.module';
import { ApiController } from './api.controller';
import { ApiService } from './api.service';

@Module({
  imports: [TextModule],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
