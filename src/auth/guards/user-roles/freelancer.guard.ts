import { Injectable } from "@nestjs/common";
import { UserRoleGuard } from "./factory.guard";
import { UserRole } from "src/model/user.entity";

@Injectable()
export class IsFreelancerGuard extends UserRoleGuard {
  constructor() {
    super();
  }

  role = UserRole.FREELANCER;
}
