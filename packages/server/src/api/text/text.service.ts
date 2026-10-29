import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  OnModuleInit,
  PayloadTooLargeException,
  ServiceUnavailableException,
} from "@nestjs/common"
import { Collection, MongoServerError } from "mongodb"
import { MongoService } from "@/lib/mongo/mongo.service"
import { generateCode, normalizeCode } from "@/api/text/text.code"

export const TEXT_TTL_MS = 5 * 60 * 1000
export const MAX_TEXT_BYTES = 50 * 1024
const MAX_CODE_ATTEMPTS = 5

interface TextDoc {
  code: string
  text: string
  createdAt: Date
  expireAt: Date
}

@Injectable()
export class TextService implements OnModuleInit {
  private readonly logger = new Logger(TextService.name)
  private indexesReady: Promise<void> | null = null

  constructor(private readonly mongoService: MongoService) {}

  private get collection(): Collection<TextDoc> {
    return this.mongoService.getTextDb().collection<TextDoc>("texts")
  }

  onModuleInit() {
    // Best effort at boot; if MongoDB is down, retried on the next request
    this.ensureIndexes().catch((err: Error) =>
      this.logger.warn(`Index setup deferred: ${err.message}`)
    )
  }

  private ensureIndexes() {
    this.indexesReady ??= this.createIndexes().catch((err) => {
      this.indexesReady = null
      throw err
    })
    return this.indexesReady
  }

  private async createIndexes() {
    await this.collection.createIndex({ code: 1 }, { unique: true })

    // TTL keyed on each doc's own expireAt. Older deployments created this index with
    // expireAfterSeconds: 300, which conflicts, so update it in place instead.
    try {
      await this.collection.createIndex({ expireAt: 1 }, { expireAfterSeconds: 0 })
    } catch (err) {
      if (!(err instanceof MongoServerError && err.codeName === "IndexOptionsConflict")) throw err
      await this.mongoService.getTextDb().command({
        collMod: "texts",
        index: { keyPattern: { expireAt: 1 }, expireAfterSeconds: 0 },
      })
    }
  }

  async getText(rawCode: unknown) {
    const code = normalizeCode(rawCode)
    if (!code) {
      throw new BadRequestException("Invalid code")
    }

    await this.ensureIndexes()
    // The TTL monitor only runs every ~60s, so also filter out expired docs it hasn't removed yet
    const doc = await this.collection.findOne({ code, expireAt: { $gt: new Date() } })
    if (!doc) {
      throw new NotFoundException("Text not found or expired")
    }

    return { success: true, text: doc.text, expiresAt: doc.expireAt.toISOString() }
  }

  async shareText(text: unknown) {
    if (typeof text !== "string" || text.trim() === "") {
      throw new BadRequestException("Text must be a non-empty string")
    }
    if (Buffer.byteLength(text, "utf8") > MAX_TEXT_BYTES) {
      throw new PayloadTooLargeException(`Text must be at most ${MAX_TEXT_BYTES / 1024} KB`)
    }

    await this.ensureIndexes()
    const createdAt = new Date()
    const expireAt = new Date(createdAt.getTime() + TEXT_TTL_MS)

    // Retry on the (rare) duplicate code; the unique index makes this race-safe
    for (let attempt = 0; attempt < MAX_CODE_ATTEMPTS; attempt++) {
      const code = generateCode()
      try {
        await this.collection.insertOne({ code, text, createdAt, expireAt })
        return { success: true, code, expiresAt: expireAt.toISOString() }
      } catch (err) {
        if (!(err instanceof MongoServerError && err.code === 11000)) throw err
      }
    }

    throw new ServiceUnavailableException("Could not allocate a code, please try again")
  }
}
