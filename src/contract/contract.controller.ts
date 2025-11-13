import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  Get,
} from "@nestjs/common";
import { ContractService } from "./contract.service";
import { CreateContractDto } from "./dto/create-contract.dto";
import { IsClientGuard } from "src/auth/guards/user-roles/client.guard";
import { Request } from "express";
import { AuthorisedRequest } from "src/common/types";
import { UsersService } from "src/user/user.service";

@Controller("contracts")
export class ContractController {
  constructor(
    private readonly svc: ContractService,
    private userService: UsersService,
  ) {}

  @Post()
  @UseGuards(IsClientGuard)
  async create(@Req() request: Request, @Body() dto: CreateContractDto) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });

    return this.svc.createFromBid(user, dto);
  }

  @Get(":id")
  @UseGuards(IsClientGuard)
  get(@Param("id") id: string) {
    return this.svc.findOne(id);
  }
}
