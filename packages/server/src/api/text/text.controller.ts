import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common"
import { Throttle, ThrottlerGuard } from "@nestjs/throttler"
import { TextService } from "@/api/text/text.service"

@Controller("api/text")
@UseGuards(ThrottlerGuard)
export class TextController {
  constructor(private readonly textService: TextService) {}

  // Codes are short, so cap lookups per IP to make guessing impractical
  @Get()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  getText(@Query("code") code: unknown) {
    return this.textService.getText(code)
  }

  @Post()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  shareText(@Body("text") text: unknown) {
    return this.textService.shareText(text)
  }
}
