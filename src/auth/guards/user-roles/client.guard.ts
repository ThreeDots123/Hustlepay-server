import { Injectable } from "@nestjs/common";
import { UserRoleGuard } from "./factory.guard";
import { UserRole } from "src/model/user.entity";
import { UsersService } from "src/user/user.service";

@Injectable()
export class IsClientGuard extends UserRoleGuard {
  constructor(usersService: UsersService) {
    super(usersService);
  }

  role = UserRole.CLIENT;
}
