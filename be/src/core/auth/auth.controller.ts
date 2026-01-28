import { Body, Controller, UseGuards } from '@nestjs/common';
import { Get, Post, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { ZodValidationPipe } from 'nestjs-zod';
import { LoginDto } from './dto/login.dto';
import { SessionAuthGuard } from './guards/session-auth.guard';
import { SignupDto } from './dto/signup.dto';
import { UsersService } from 'src/packages/users/users.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private usersService: UsersService,
  ) {}

  @Post('signin')
  @UseGuards(AuthGuard('local'))
  async signin(
    @Body(new ZodValidationPipe(LoginDto)) dto: LoginDto,
    @Request() req: Request,
  ) {
    return await this.authService.signin(req);
  }

  @Post('signup')
  async signup(
    @Body(new ZodValidationPipe(SignupDto)) dto: SignupDto,
    @Request() req: Request,
  ) {
    return await this.authService.signup(dto, req);
  }
}
