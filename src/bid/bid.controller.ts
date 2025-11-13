import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Patch,
  Get,
} from "@nestjs/common";
import { BidService } from "./bid.service";
import { CreateBidDto } from "./dto/create-bid.dto";
import { UsersService } from "src/user/user.service";
import { IsFreelancerGuard } from "src/auth/guards/user-roles/freelancer.guard";
import { IsClientGuard } from "src/auth/guards/user-roles/client.guard";
import { Request } from "express";
import { AuthorisedRequest } from "src/common/types";

@Controller("proposals/:proposalId/bids")
export class BidController {
  constructor(
    private readonly svc: BidService,
    private userService: UsersService,
  ) {}

  @Post()
  @UseGuards(IsFreelancerGuard)
  async create(
    @Param("proposalId") proposalId: string,
    @Body() dto: CreateBidDto,
    @Req() request: Request,
  ) {
    const { id } = request.user as AuthorisedRequest;
    return this.svc.create(id, proposalId, dto);
  }

  @Get()
  @UseGuards(IsClientGuard)
  async retrieveClientBids(
    @Param("proposalId") proposalId: string,
    @Req() request: Request,
  ) {
    const { id } = request.user as AuthorisedRequest;
    return this.svc.findByProposal(proposalId, id);
  }

  @Get(":id/client")
  @UseGuards(IsClientGuard)
  async clientBidDetails(
    @Param("proposalId") proposalId: string,
    @Param("id") bidId: string,
    @Req() request: Request,
  ) {
    const { id } = request.user as AuthorisedRequest;
    return this.svc.findOne(bidId, proposalId, { clientId: id });
  }

  @Get(":id/freelancer")
  @UseGuards(IsFreelancerGuard)
  async freelancerBidDetails(
    @Param("proposalId") proposalId: string,
    @Param("id") bidId: string,
    @Req() request: Request,
  ) {
    const { id } = request.user as AuthorisedRequest;
    return this.svc.findOne(bidId, proposalId, { freelancerId: id });
  }

  @Patch(":id/withdraw")
  @UseGuards(IsFreelancerGuard)
  async withdraw(@Param("id") bidId: string, @Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });

    return this.svc.withdraw(user, bidId);
  }

  @Patch(":id/accept")
  @UseGuards(IsClientGuard)
  async accept(@Param("id") bidId: string, @Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });
    return this.svc.accept(user, bidId);
  }
}
