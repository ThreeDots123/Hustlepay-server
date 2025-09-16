import { Controller, UseGuards, Get, Request } from '@nestjs/common';
import { jwtAuthGuard } from 'src/auth/jwt.guard';
import { UsersService } from './user.service';

@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @UseGuards(jwtAuthGuard)
  @Get('profile')
  async getprofile(@Request() req) {
    const user = await this.usersService.findUserById(req.user.userId);
    return user;
  }
}
