import { UserRole } from "src/model/user.entity";

export type AuthorisedRequest = {
  id: string;
  // role: Exclude<UserRole, UserRole.ADMIN>;
  role: UserRole;
};
