import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { JWT_SECRET } from 'src/config/env';
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: configService.getOrThrow<string>(JWT_SECRET),
      ignoreExpiration: false,
    });
  }

  async validate(payload: any) {
    console.log('JWT payload:', payload);
    return { userId: payload.sub, email: payload.email, role: payload.role };
  }
}
