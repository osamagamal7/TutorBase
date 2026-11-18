import { Controller, Get } from '@nestjs/common';
import { AppService } from './app.service.js';
import { UserSchema } from '@tutorbase/shared';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    console.log('hi');
    return this.appService.getHello();
  }
}
