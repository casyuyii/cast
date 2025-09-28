import { Injectable } from "@nestjs/common"

@Injectable()
export class AppService {
  checkServer() {
    return { code: "200", status: "Api Test string v3" }
  }
}
