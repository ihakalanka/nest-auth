import { Body, Controller, Post } from '@nestjs/common';
import { User } from 'src/schemas/user.model';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() user: User) {
    return await this.authService.createUser(user);
  }
}
