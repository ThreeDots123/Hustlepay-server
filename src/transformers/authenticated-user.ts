import { User } from "src/model/user.entity";
import transformerFactory from "./factory";
import { UserResponseDto } from "src/user/dto/user-response.dto";

function transformToAuthenticatedUser(user: Partial<User>) {
  return transformerFactory(user, UserResponseDto);
}

export default transformToAuthenticatedUser;
