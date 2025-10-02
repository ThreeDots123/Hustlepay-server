import { Request } from "express";
import {
  Controller,
  UseGuards,
  Get,
  Req,
  Put,
  Param,
  Body,
} from "@nestjs/common";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { UsersService } from "./user.service";
import { ProfileService } from "src/profile/profile.service";
import transformUserProfile from "src/transformers/user-profile";
import { UserRole } from "src/model/user.entity";
import { AuthorisedRequest } from "src/common/types";
import { ClientProfileDto } from "src/profile/dto/client-profile.dto";
import { FreelancerProfileDto } from "src/profile/dto/freelancer-profile.dto";

@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private profileService: ProfileService,
  ) {}

  @UseGuards(JwtAuthGuard)
  @Get("freelancer/profile")
  async getFreelancerProfile(@Req() request: Request) {
    const { id, role } = request.user as AuthorisedRequest;

    if (role !== UserRole.FREELANCER) return {};

    const user = await this.profileService.retreiveProfile(id, "freelancer");

    if (!user) return {};

    return transformUserProfile(user);
  }

  @UseGuards(JwtAuthGuard)
  @Get("client/profile")
  async getClientProfile(@Req() request: Request) {
    const { id, role } = request.user as AuthorisedRequest;

    if (role !== UserRole.CLIENT) return {};

    const user = await this.profileService.retreiveProfile(id, "client");

    if (!user) return {};

    return transformUserProfile(user);
  }

  @UseGuards(JwtAuthGuard)
  @Put("freelancer/profile")
  async updateFreelancerProfile(
    @Req() request: Request,
    @Body() _body: FreelancerProfileDto,
  ) {
    const { id } = request.user as AuthorisedRequest;
    await this.profileService.updateFreelancerProfile(id, _body);

    return "updated";
  }

  @UseGuards(JwtAuthGuard)
  @Put("client/profile")
  async updateClientProfile(
    @Req() request: Request,
    @Body() _body: ClientProfileDto,
  ) {
    const { id } = request.user as AuthorisedRequest;
    await this.profileService.updateClientProfile(id, _body);

    return "updated";
  }
}
