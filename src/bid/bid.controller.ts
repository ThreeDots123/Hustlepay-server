import {
  Controller,
  Post,
  Body,
  Param,
  UseGuards,
  Req,
  Patch,
  Get,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { FilesInterceptor } from "@nestjs/platform-express";
import { BidService } from "./bid.service";
import { CreateBidDto } from "./dto/create-bid.dto";
import { UsersService } from "src/user/user.service";
import { IsFreelancerGuard } from "src/auth/guards/user-roles/freelancer.guard";
import { IsClientGuard } from "src/auth/guards/user-roles/client.guard";
import { Request } from "express";
import { AuthorisedRequest } from "src/common/types";

@ApiTags("Bids")
@Controller("proposals/:proposalId/bids")
export class BidController {
  constructor(
    private readonly svc: BidService,
    private userService: UsersService,
  ) {}

  @Post()
  @UseGuards(IsFreelancerGuard)
  @UseInterceptors(FilesInterceptor("attachments", 10)) // Max 10 files
  @ApiBearerAuth("JWT-auth")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Create a bid on a proposal",
    description:
      "Creates a new bid on a proposal. Only freelancers can create bids. Supports file attachments (max 10 files, 50MB each).",
  })
  @ApiParam({
    name: "proposalId",
    description: "Proposal ID to bid on",
    type: String,
    example: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["title", "coverLetter", "proposedBudget", "proposedDurationDays"],
      properties: {
        title: {
          type: "string",
          example: "Professional Web Development Service",
          description: "Bid title",
        },
        coverLetter: {
          type: "string",
          example: "I have extensive experience in web development...",
          description: "Cover letter (min 50 characters)",
        },
        proposedBudget: {
          type: "number",
          example: 150000,
          description: "Proposed budget in Naira",
        },
        rateType: {
          type: "string",
          enum: ["FIXED", "HOURLY"],
          example: "FIXED",
          description: "Rate type",
        },
        proposedDurationDays: {
          type: "number",
          example: 21,
          description: "Proposed duration in days",
        },
        experience: {
          type: "string",
          enum: ["BEGINNER", "INTERMEDIATE", "ADVANCED", "EXPERT"],
          example: "ADVANCED",
          description: "Experience level",
        },
        portfolio: {
          type: "string",
          format: "uri",
          example: "https://portfolio.example.com",
          description: "Portfolio URL",
        },
        attachments: {
          type: "array",
          items: {
            type: "string",
            format: "binary",
          },
          description: "File attachments (max 10 files, 50MB each)",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Bid created successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Validation error - Invalid bid data",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a freelancer",
  })
  @ApiResponse({
    status: 404,
    description: "Proposal not found",
  })
  async create(
    @Param("proposalId") proposalId: string,
    @Body() dto: CreateBidDto,
    @Req() request: Request,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
          new FileTypeValidator({
            fileType: /(image|video|application)\/(.*)/,
          }),
        ],
        fileIsRequired: false, // Attachments are optional
      }),
    )
    files?: Express.Multer.File[],
  ) {
    const { id } = request.user as AuthorisedRequest;
    return this.svc.create(id, proposalId, dto, files || []);
  }

  @Get()
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get all bids on a proposal",
    description:
      "Retrieves all bids submitted for a specific proposal. Only accessible to the proposal owner (client).",
  })
  @ApiParam({
    name: "proposalId",
    description: "Proposal ID",
    type: String,
    example: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiResponse({
    status: 200,
    description: "List of bids retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not the proposal owner",
  })
  @ApiResponse({
    status: 404,
    description: "Proposal not found",
  })
  async retrieveClientBids(
    @Param("proposalId") proposalId: string,
    @Req() request: Request,
  ) {
    const { id } = request.user as AuthorisedRequest;
    return this.svc.findByProposal(proposalId, id);
  }

  @Get(":id/client")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get bid details (client view)",
    description:
      "Retrieves detailed information about a specific bid. Only accessible to the proposal owner (client).",
  })
  @ApiParam({
    name: "proposalId",
    description: "Proposal ID",
    type: String,
    example: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiParam({
    name: "id",
    description: "Bid ID",
    type: String,
    example: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiResponse({
    status: 200,
    description: "Bid details retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not the proposal owner",
  })
  @ApiResponse({
    status: 404,
    description: "Bid or proposal not found",
  })
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
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get bid details (freelancer view)",
    description:
      "Retrieves detailed information about a specific bid. Only accessible to the bid owner (freelancer).",
  })
  @ApiParam({
    name: "proposalId",
    description: "Proposal ID",
    type: String,
    example: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiParam({
    name: "id",
    description: "Bid ID",
    type: String,
    example: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiResponse({
    status: 200,
    description: "Bid details retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not the bid owner",
  })
  @ApiResponse({
    status: 404,
    description: "Bid or proposal not found",
  })
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
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Withdraw a bid",
    description:
      "Withdraws a bid from a proposal. Only the bid owner (freelancer) can withdraw their bid.",
  })
  @ApiParam({
    name: "id",
    description: "Bid ID",
    type: String,
    example: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiResponse({
    status: 200,
    description: "Bid withdrawn successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not the bid owner",
  })
  @ApiResponse({
    status: 404,
    description: "Bid not found",
  })
  async withdraw(@Param("id") bidId: string, @Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });

    return this.svc.withdraw(user, bidId);
  }

  @Patch(":id/accept")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Accept a bid",
    description:
      "Accepts a bid on a proposal. Only the proposal owner (client) can accept bids. This typically creates a contract.",
  })
  @ApiParam({
    name: "id",
    description: "Bid ID to accept",
    type: String,
    example: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiResponse({
    status: 200,
    description: "Bid accepted successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not the proposal owner",
  })
  @ApiResponse({
    status: 404,
    description: "Bid not found",
  })
  async accept(@Param("id") bidId: string, @Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });
    return this.svc.accept(user, bidId);
  }
}

@ApiTags("Bids")
@Controller("bids")
export class ClientBidsController {
  constructor(private readonly svc: BidService) {}

  @Get("active")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get active bids for client",
    description:
      "Retrieves all active bids across all proposals owned by the authenticated client.",
  })
  @ApiResponse({
    status: 200,
    description: "List of active bids retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a client",
  })
  async getActiveBids(@Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    return this.svc.findActiveBidsForClient(id);
  }
}
