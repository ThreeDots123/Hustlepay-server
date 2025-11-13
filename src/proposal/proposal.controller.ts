import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Get,
  Param,
  Query,
  Patch,
} from "@nestjs/common";
import { ProposalService } from "./proposal.service";
import { CreateProposalDto } from "./dto/create-proposal.dto";
import { UpdateProposalDto } from "./dto/update-proposal.dto";
import { IsClientGuard } from "src/auth/guards/user-roles/client.guard";
import { Request } from "express";
import { AuthorisedRequest } from "src/common/types";
import { UsersService } from "src/user/user.service";

@Controller("proposals")
export class ProposalController {
  constructor(
    private readonly svc: ProposalService,
    private userService: UsersService,
  ) {}

  @Post()
  @UseGuards(IsClientGuard)
  async create(@Req() request: Request, @Body() dto: CreateProposalDto) {
    const { id } = request.user as AuthorisedRequest;
    return this.svc.create(id, dto);
  }

  @Get()
  async list(
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Query("skill") skill: string,
    @Req() request: Request,
  ) {
    return this.svc.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      skill,
    });
  }

  @Get("/me")
  @UseGuards(IsClientGuard)
  async listMyProposals(
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Query("skill") skill: string,
    @Req() request: Request,
  ) {
    const { id } = request.user as AuthorisedRequest;
    return this.svc.findAll(
      {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        skill,
      },
      id,
    );
  }

  @Get(":id")
  get(@Param("id") id: string) {
    return this.svc.findOne(id);
  }

  @Patch(":id")
  @UseGuards(IsClientGuard)
  async update(
    @Param("id") proposalId: string,
    @Req() request: Request,
    @Body() dto: UpdateProposalDto,
  ) {
    const { id } = request.user as AuthorisedRequest;
    return this.svc.update(proposalId, id, dto);
  }

  @Patch(":id/close")
  @UseGuards(IsClientGuard)
  async close(@Param("id") proposalId: string, @Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });
    return this.svc.close(proposalId, user);
  }

  @Get("skills/suggest")
  async suggestSkills(@Query("query") query: string) {
    return this.svc.suggestSkills(query);
  }
}
