import { Module } from "@nestjs/common"
import { TextModule } from "@/api/text/text.module"
import { ApiController } from "@/api/api.controller"
import { ApiService } from "@/api/api.service"

@Module({
  imports: [TextModule],
  controllers: [ApiController],
  providers: [ApiService],
})
export class ApiModule {}
