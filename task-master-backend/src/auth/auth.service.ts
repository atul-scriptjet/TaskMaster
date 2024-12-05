import { Injectable, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';
import { UsersService } from 'src/users/users.service';

@Injectable()
export class AuthService {
  constructor(private usersService: UsersService) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.usersService.findByEmail(email);
    if (!user) {
      console.log(`User with email ${email} not found`);
      return null;
    }
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      console.log(`Invalid password for email ${email}`);
      return null;
    }
    const { ...result } = user.toObject();
    return result;
  }
  async login(email: string, password: string) {
    const isValide = await this.validateUser(email, password);
    if (isValide == null) {
      throw new UnauthorizedException('Invalid credentials');
    }
    return isValide;
  }
}
