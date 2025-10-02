import { Injectable } from "@nestjs/common";
import { UserRoleGuard } from "./factory.guard";
import { UserRole } from "src/model/user.entity";

@Injectable()
export class IsAdminGuard extends UserRoleGuard {
  constructor() {
    super();
  }

  role = UserRole.ADMIN;
}
