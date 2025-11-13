import { User } from "src/model/user.entity";

//* Extended request
export declare module "@types/express/index" {
  declare interface Request {
    role?: User["role"];
    id?: Partial<User>;
  }
}
