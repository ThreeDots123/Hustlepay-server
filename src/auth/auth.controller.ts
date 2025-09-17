import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { CreateUserDto } from "../user/dto/create-user-pswrd.dto";
import transformToAuthenticatedUser from "src/transformers/authenticated-user";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  async signup(@Body() _body: CreateUserDto) {
    if (!_body.password)
      throw new BadRequestException(["password is required"]);

    const result = await this.authService.signUp(_body);
    return {
      ...result,
      user: transformToAuthenticatedUser(result.user),
      event: "verify your account.",
    };
  }

  @Post("login")
  async login(@Body() _body: { email: string; password: string }) {
    return this.authService.login(_body.email, _body.password);
  }
}
