import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { EntityManager } from "typeorm";
import { JwtService } from "@nestjs/jwt";
import { CreateUserDto } from "../user/dto/create-user-pswrd.dto";
import { InjectEntityManager } from "@nestjs/typeorm";
import { UsersService } from "src/user/user.service";
import { PasswordService } from "src/password/password.service";
import { EventEmitter2 } from "@nestjs/event-emitter";
import events from "src/event";
import { UserCreatedEvent } from "src/event/subscribers/user/user-created.subscriber";
import { ConfigService } from "@nestjs/config";
import {
  GOOGLE_CLIENT_ID,
  GOOGLE_REDIRECT_URI,
  GOOGLE_SECRET_KEY,
} from "src/config/env";
import { AuthMethod, UserRole } from "src/model/user.entity";

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private passwordService: PasswordService,
    private eventEmitter: EventEmitter2,
    private configService: ConfigService,
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
        // Emit an event for created user
        this.eventEmitter.emit(events.user.created, {
          event: new UserCreatedEvent(
            user.email,
            user.firstname,
            user.id,
            user.role,
          ),
          transactionalManager,
        });

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

    if (!user) throw new UnauthorizedException("Invalid Email or Password.");

    if (
      user &&
      (await this.passwordService.comparePasswords(password, user.password.key))
    ) {
      // Update login time
      const payload = { id: user.id, role: user.role };
      await this.usersService.updateUserLogin(user.id);

      return {
        access_token: this.jwtService.sign(payload),
        user,
      };
    }

    throw new UnauthorizedException("Invalid Email or Password.");
  }

  async handleGoogleCallback(
    code: string,
    action: "signup" | "login",
    role: UserRole,
    transactionalEntity?: EntityManager,
  ) {
    const clientId = this.configService.getOrThrow<string>(GOOGLE_CLIENT_ID);
    const clientSecret =
      this.configService.getOrThrow<string>(GOOGLE_SECRET_KEY);
    const redirectUri =
      this.configService.getOrThrow<string>(GOOGLE_REDIRECT_URI);

    // Exchange code for access token
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      throw new BadRequestException("Failed to exchange Google code for token");
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    // Get user info from Google
    const userResponse = await fetch(
      "https://www.googleapis.com/oauth2/v2/userinfo",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    );

    if (!userResponse.ok) {
      throw new BadRequestException("Failed to fetch Google user info");
    }

    const googleUser = await userResponse.json();

    // Extract email and username from Google
    const email = googleUser.email;
    const first_name = googleUser.given_name || googleUser.name || "";
    const last_name = googleUser.family_name || "";

    if (!email)
      throw new BadRequestException(
        "Google account does not have an email address",
      );

    if (action === "signup") {
      // Create user
      // Check if user already exists
      const existingUser = await this.usersService.findSingleUser({
        where: { email },
      });

      if (existingUser) {
        throw new BadRequestException(
          "An account with this email already exists. Please login instead.",
        );
      }

      // Create new user with Google auth
      const user = await this.usersService.createUser(
        {
          email,
          firstname: first_name,
          lastname: last_name,
          role,
          authMethod: AuthMethod.GMAIL,
        },
        transactionalEntity,
      );

      const payload = { id: user.id, role: user.role };
      return {
        user,
        access_token: this.jwtService.sign(payload),
      };
    } else {
      // log-in user
      // Login: Find existing user
      const user = await this.usersService.findSingleUser({
        where: { email },
      });

      if (!user) {
        throw new UnauthorizedException(
          "No account found with this Google email. Please register first.",
        );
      }

      const payload = { id: user.id, role: user.role };
      return {
        access_token: this.jwtService.sign(payload),
        user,
      };
    }
  }
}
