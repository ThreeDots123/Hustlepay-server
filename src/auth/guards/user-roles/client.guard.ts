import { Injectable } from "@nestjs/common";
import { UserRoleGuard } from "./factory.guard";
import { UserRole } from "src/model/user.entity";

@Injectable()
export class IsClientGuard extends UserRoleGuard {
  constructor() {
    super();
  }

  role = UserRole.CLIENT;
}
