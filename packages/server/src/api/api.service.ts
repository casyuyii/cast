import { Injectable } from '@nestjs/common';

@Injectable()
export class ApiService {
  checkApi() {
    return 'Api';
  }
}
