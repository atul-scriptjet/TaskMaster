import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(private readonly jwtService: JwtService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();

    const token = request.cookies?.access_token; // Extract from cookie
    if (!token) {
      throw new UnauthorizedException('No access token provided');
    }

    try {
      const decoded = this.jwtService.verify(token); // Decode token
      request.user = decoded; // Attach decoded user to the request
      return true;
    } catch (error) {
      throw new UnauthorizedException('Invalid access token');
    }
  }
}
