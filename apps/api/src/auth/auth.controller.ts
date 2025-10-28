import { Body, Controller, Post } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpDto } from './dto/signup.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('signup')
  async signUp(@Body() dto: SignUpDto) {
    const res = await this.authService.signUp(dto);
    return res.ok ? { ok: true, data: res.data } : { ok: false, error: res.error };
  }
}
