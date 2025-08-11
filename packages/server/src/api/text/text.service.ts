import { Injectable } from '@nestjs/common';

@Injectable()
export class TextService {
  getText(code: string) {
    return { text: `Test ${code}` };
  }

  shareText(text: string) {
    return { code: text + '123' };
  }
}
