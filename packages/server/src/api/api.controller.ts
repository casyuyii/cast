import { Controller, Get } from "@nestjs/common"
import { ApiService } from "@/api/api.service"

@Controller("api")
export class ApiController {
  constructor(private readonly apiService: ApiService) {}

  @Get()
  checkApi() {
    return this.apiService.checkApi()
  }
}
