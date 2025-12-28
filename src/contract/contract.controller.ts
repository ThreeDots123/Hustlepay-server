import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  Get,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { ContractService } from "./contract.service";
import { CreateContractDto } from "./dto/create-contract.dto";
import { IsClientGuard } from "src/auth/guards/user-roles/client.guard";
import { Request } from "express";
import { AuthorisedRequest } from "src/common/types";
import { UsersService } from "src/user/user.service";

@ApiTags("Contracts")
@Controller("contracts")
export class ContractController {
  constructor(
    private readonly svc: ContractService,
    private userService: UsersService,
  ) {}

  @Post()
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Create a contract from a bid",
    description:
      "Creates a contract based on an accepted bid. Only clients can create contracts from bids they've accepted.",
  })
  @ApiBody({
    type: CreateContractDto,
    description: "Contract creation data",
  })
  @ApiResponse({
    status: 201,
    description: "Contract created successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Validation error - Invalid contract data or bid not accepted",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a client or not the proposal owner",
  })
  @ApiResponse({
    status: 404,
    description: "Bid not found",
  })
  async create(@Req() request: Request, @Body() dto: CreateContractDto) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });

    return this.svc.createFromBid(user, dto);
  }

  @Get(":id")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get contract details",
    description:
      "Retrieves detailed information about a specific contract. Only clients can view contracts.",
  })
  @ApiParam({
    name: "id",
    description: "Contract ID",
    type: String,
    example: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiResponse({
    status: 200,
    description: "Contract details retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a client",
  })
  @ApiResponse({
    status: 404,
    description: "Contract not found",
  })
  get(@Param("id") id: string) {
    return this.svc.findOne(id);
  }
}
