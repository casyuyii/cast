import { Controller, Get, Post, Query } from '@nestjs/common';
import { TextService } from './text.service';

@Controller('api/text')
export class TextController {
  constructor(private readonly textService: TextService) {}

  @Get()
  getText(@Query('code') code: string) {
    console.log('getText', code);
    return this.textService.getText(code);
  }

  @Post()
  shareText(@Query('text') text: string) {
    return this.textService.shareText(text);
  }
}
