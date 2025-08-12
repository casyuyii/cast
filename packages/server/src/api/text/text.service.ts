import { Injectable } from '@nestjs/common';
import { MongoService } from '@/lib/mongo/mongo.service';

@Injectable()
export class TextService {
  constructor(private readonly mongoService: MongoService) {}

  getText(code: string) {
    return { text: `Test ${code}` };
  }

  async shareText(text: string) {
    const db = this.mongoService.getTextDb();
    const collection = db.collection('texts');
    await collection.insertOne({ text });
    return { code: text + '123' };
  }
}
