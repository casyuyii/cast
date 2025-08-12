import { Injectable } from '@nestjs/common';
import { MongoDBService } from '@/lib/mongo.service';

@Injectable()
export class TextService {
  constructor(private readonly mongoDBService: MongoDBService) {}

  getText(code: string) {
    return { text: `Test ${code}` };
  }

  async shareText(text: string) {
    const db = this.mongoDBService.getTextDb();
    const collection = db.collection('texts');
    await collection.insertOne({ text });
    return { code: text + '123' };
  }
}
