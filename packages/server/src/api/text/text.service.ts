import { Injectable } from '@nestjs/common';

@Injectable()
export class TextService {
  getText(code: string) {
    return `Test ${code}`;
  }

  shareText(text: string) {
    return text;
  }
}
