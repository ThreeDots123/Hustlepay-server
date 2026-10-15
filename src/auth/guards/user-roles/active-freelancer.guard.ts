import {
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from "@nestjs/common";
import { Request } from "express";
import { AuthorisedRequest } from "src/common/types";
import { UserStatus } from "src/model/user.entity";
import { UsersService } from "src/user/user.service";
import { IsFreelancerGuard } from "./freelancer.guard";

@Injectable()
export class ActiveFreelancerGuard extends IsFreelancerGuard {
  constructor(usersService: UsersService) {
    super(usersService);
  }

  async canActivate(context: ExecutionContext) {
    const canContinue = await super.canActivate(context);
    if (!canContinue) return false;

    const request = context.switchToHttp().getRequest<Request>();
    const { id } = request.user as AuthorisedRequest;

    const user = await this.usersService.findSingleUser({
      where: { id },
    });
    if (!user || user.status !== UserStatus.ACTIVE) {
      throw new ForbiddenException("Freelancer account is not activated.");
    }
    return true;
  }
}
