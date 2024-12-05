import { Controller, Post, Body, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import { UsersService } from 'src/users/users.service';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { JwtService } from '@nestjs/jwt';
import { Request, Response } from 'express';
import { NODE_ENV } from 'src/config';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UsersService,
    private jwtService: JwtService,
  ) {}

  @Post('register')
  async register(
    @Body() body: { username: string; email: string; password: string },
  ) {
    return this.userService.create(body.username, body.email, body.password);
  }

  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(
    @Body() body: { email: string; password: string },
    @Res() res: Response,
  ) {
    const user = await this.authService.login(body.email, body.password);
    const payload = { email: user.email, sub: user._id };
    const accessToken = this.jwtService.sign(payload);
    res.cookie('access_token', accessToken, {
      httpOnly: true,
      secure: NODE_ENV === 'production',
      sameSite: NODE_ENV === 'production' ? 'none' : 'lax', // 'none' for cross-origin
      maxAge: 60 * 60 * 1000, // 1 hour
    });

    return res.send({ message: 'Logged in successfully' });
  }
}
