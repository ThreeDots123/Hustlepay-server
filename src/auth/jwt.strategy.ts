import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SERVICE || 'secret123',
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    console.log('JWT payload:', payload);
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
