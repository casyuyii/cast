import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello() {
    return { code: '200', text: 'Api Test string v3' };
  }
}
