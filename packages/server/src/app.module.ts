import { Module } from "@nestjs/common"
import { AppController } from "@/app.controller"
import { AppService } from "@/app.service"
import { ConfigModule } from "@nestjs/config"
import { ApiModule } from "@/api/api.module"
import { MongoModule } from "./lib/mongo/mongo.module"

@Module({
  imports: [ConfigModule.forRoot({ isGlobal: true }), ApiModule, MongoModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
