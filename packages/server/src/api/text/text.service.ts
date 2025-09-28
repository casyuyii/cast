import { Injectable } from "@nestjs/common"
import { MongoService } from "@/lib/mongo/mongo.service"
import { ObjectId } from "mongodb"

@Injectable()
export class TextService {
  constructor(private readonly mongoService: MongoService) {}

  async getText(code: string) {
    if (!ObjectId.isValid(code)) {
      return { success: false, text: "Invalid code" }
    }

    const db = this.mongoService.getTextDb()
    const collection = db.collection("texts")
    const result = await collection.findOne({ _id: new ObjectId(code) })
    if (!result) {
      return { success: false, text: "Not found" }
    }

    return { success: true, text: result.text as string }
  }

  async shareText(text: string) {
    const db = this.mongoService.getTextDb()
    const collection = db.collection("texts")
    await collection.createIndex({ expireAt: 1 }, { expireAfterSeconds: 300 })
    const result = await collection.insertOne({
      text,
      expireAt: new Date(),
    })
    if (!result.acknowledged) {
      return { success: false, text: "Failed to share text" }
    }
    return { success: true, code: result.insertedId.toString() }
  }
}
