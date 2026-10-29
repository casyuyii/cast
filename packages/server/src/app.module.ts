import { Module } from "@nestjs/common"
import { AppController } from "@/app.controller"
import { AppService } from "@/app.service"
import { ConfigModule } from "@nestjs/config"
import { ApiModule } from "@/api/api.module"
import { MongoModule } from "./lib/mongo/mongo.module"
import { ThrottlerModule } from "@nestjs/throttler"

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    // Per-route limits are set with @Throttle; this is the fallback
    ThrottlerModule.forRoot([{ ttl: 60_000, limit: 60 }]),
    ApiModule,
    MongoModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
