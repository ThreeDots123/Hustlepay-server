import {
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { JwtAuthGuard } from "../jwt.guard";
import { Request } from "express";
import { AuthorisedRequest } from "src/common/types";
import { UserRole } from "src/model/user.entity";

@Injectable()
export abstract class UserRoleGuard extends JwtAuthGuard {
  constructor() {
    super();
  }

  abstract readonly role: UserRole;

  async canActivate(context: ExecutionContext) {
    const canContinue = await super.canActivate(context);

    if (canContinue) {
      const request: Request = context.switchToHttp().getRequest();

      const { role: userRole } = request.user as AuthorisedRequest;

      if (this.role === userRole) return true;

      throw new UnauthorizedException(
        "User does not have the appropriate role for this route. Expected ro;e of " +
          this.role,
      );
    }

    return false;
  }
}
