import { NestFactory } from "@nestjs/core"
import { NestExpressApplication } from "@nestjs/platform-express"
import { AppModule } from "./app.module"
import { MongoUnavailableFilter } from "@/lib/mongo/mongo-unavailable.filter"

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule)

  // Behind nginx: use X-Forwarded-For so rate limits apply per client, not per proxy
  app.set("trust proxy", 1)
  app.useGlobalFilters(new MongoUnavailableFilter())

  const origins = process.env.CORS_ORIGINS?.split(",").map((o) => o.trim())
  app.enableCors(origins?.length ? { origin: origins } : undefined)

  await app.listen(process.env.PORT ?? 3100)
}
bootstrap()
