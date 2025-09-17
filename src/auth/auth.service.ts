import { Injectable, UnauthorizedException } from "@nestjs/common";
import * as bcrypt from "bcryptjs";
import { EntityManager } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { CreateUserDto } from "../user/dto/create-user-pswrd.dto";
import { InjectEntityManager } from "@nestjs/typeorm";
import { UsersService } from "src/user/user.service";
import { PasswordService } from "src/password/password.service";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private passwordService: PasswordService,
    @InjectEntityManager() private readonly manager: EntityManager,
  ) {}

  async signUp(data: CreateUserDto) {
    const { password, ...userInfo } = data;

    const newUser = await this.manager.transaction(
      async (transactionalManager) => {
        // Register new user (Throws an error if email exists already)
        const user = await this.usersService.createUser(
          userInfo,
          transactionalManager,
        );

        // Hash user password
        const passwordHash = await this.passwordService.hashPassword(password);
        // Create password and user to password
        await this.passwordService.createPasswordForUser(
          passwordHash,
          user,
          transactionalManager,
        );

        // Emit event to handle user registeration workflow

        return user;
      },
    );

    const payload = { id: newUser.id, role: newUser.role };
    return {
      user: newUser,
      access_token: this.jwtService.sign(payload),
    };
  }

  async login(email: string, password: string) {
    const user = await this.usersService.findSingleUser({
      relations: ["password"],
      where: { email },
    });

    if (!user) throw new UnauthorizedException("Invalid credential");

    if (
      user &&
      (await this.passwordService.comparePasswords(password, user.password.key))
    ) {
      // Update login time
      const payload = { id: user.id, role: user.role };
      await this.usersService.updateUserLogin(user.id);

      return {
        access_token: this.jwtService.sign(payload),
      };
    }

    throw new UnauthorizedException("Invalid Email or Password.");
  }
}
