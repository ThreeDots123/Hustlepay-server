import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../jwt.guard";
import { Request } from "express";
import { AuthorisedRequest } from "src/common/types";
import { UserRole, UserStatus } from "src/model/user.entity";
import { UsersService } from "src/user/user.service";

@Injectable()
export abstract class UserRoleGuard extends JwtAuthGuard {
  constructor(protected readonly usersService: UsersService) {
    super();
  }

  abstract readonly role: UserRole;

  async canActivate(context: ExecutionContext) {
    const canContinue = await super.canActivate(context);

    if (canContinue) {
      const request: Request = context.switchToHttp().getRequest();
      const { id, role: userRole } = request.user as AuthorisedRequest;

      if (this.role !== userRole) {
        throw new UnauthorizedException(
          "User does not have the appropriate role for this route. Expected role of " +
            this.role,
        );
      }

      const user = await this.usersService.findSingleUser({ where: { id } });
      if (user?.status === UserStatus.SUSPENDED) {
        throw new ForbiddenException("Account suspended.");
      }

      return true;
    }

    return false;
  }
}
