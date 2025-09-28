import { Body, Controller, Get, Post, Query } from "@nestjs/common"
import { TextService } from "@/api/text/text.service"

@Controller("api/text")
export class TextController {
  constructor(private readonly textService: TextService) {}

  @Get()
  getText(@Query("code") code: string) {
    return this.textService.getText(code)
  }

  @Post()
  shareText(@Body("text") text: string) {
    return this.textService.shareText(text)
  }
}
