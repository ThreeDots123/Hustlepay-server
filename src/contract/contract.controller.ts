import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  Get,
  Query,
  UseInterceptors,
  UploadedFiles,
  ParseFilePipe,
  MaxFileSizeValidator,
  FileTypeValidator,
} from "@nestjs/common";
import { FilesInterceptor } from "@nestjs/platform-express";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
  ApiConsumes,
} from "@nestjs/swagger";
import { ContractService } from "./contract.service";
import { CreateContractDto } from "./dto/create-contract.dto";
import { SubmitContractDto } from "./dto/submit-contract.dto";
import { IsClientGuard } from "src/auth/guards/user-roles/client.guard";
import { ActiveFreelancerGuard } from "src/auth/guards/user-roles/active-freelancer.guard";
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

  @Get("responses")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get all response contracts for client",
    description:
      "Retrieves all pending_client_approval contracts for proposals owned by the authenticated client, excluding proposals with active contracts.",
  })
  @ApiResponse({
    status: 200,
    description: "List of response contracts retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a client",
  })
  async getResponsesContracts(@Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    console.log("Here");
    return this.svc.findResponsesContractsForClient(id);
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

  @Get("proposal/:proposalId")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get all contracts for a proposal",
    description:
      "Retrieves all contracts (accepted freelancers) for a specific proposal. Only the proposal owner (client) can view these.",
  })
  @ApiParam({
    name: "proposalId",
    description: "Proposal ID",
    type: String,
    example: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiResponse({
    status: 200,
    description: "Contracts retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a client or not the proposal owner",
  })
  async getByProposal(
    @Param("proposalId") proposalId: string,
    @Req() request: Request,
  ) {
    const { id } = request.user as AuthorisedRequest;
    return this.svc.findByProposal(proposalId, id);
  }

  @Post(":id/approve")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Approve a contract",
    description:
      "Approves a contract that was created when a freelancer accepted a proposal. Moves contract from PENDING_CLIENT_APPROVAL to AWAITING_PAYMENT and marks proposal as HIRED.",
  })
  @ApiParam({
    name: "id",
    description: "Contract ID",
    type: String,
    example: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiResponse({
    status: 200,
    description: "Contract approved successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Contract cannot be approved",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a client or not the contract owner",
  })
  @ApiResponse({
    status: 404,
    description: "Contract not found",
  })
  async approve(@Param("id") contractId: string, @Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });
    return this.svc.approveContract(contractId, user.id);
  }

  @Get("freelancer/active")
  @UseGuards(ActiveFreelancerGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get active contracts for freelancer",
    description:
      "Retrieves all active contracts (active or awaiting_payment or completed) for the authenticated freelancer with pagination support.",
  })
  @ApiResponse({
    status: 200,
    description: "Active contracts retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a freelancer",
  })
  async getActiveContracts(
    @Req() request: Request,
    @Query("page") page?: number,
    @Query("limit") limit?: number,
  ) {
    const { id } = request.user as AuthorisedRequest;
    return this.svc.findActiveContractsForFreelancer(
      id,
      page ? Number(page) : undefined,
      limit ? Number(limit) : undefined,
    );
  }

  @Get("freelancer/completed")
  @UseGuards(ActiveFreelancerGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get completed contracts for freelancer",
    description:
      "Retrieves all completed contracts for the authenticated freelancer.",
  })
  @ApiResponse({
    status: 200,
    description: "Completed contracts retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a freelancer",
  })
  async getCompletedContracts(@Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    return this.svc.findCompletedContractsForFreelancer(id);
  }

  @Get("client/stats")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get client dashboard stats",
    description:
      "Returns amount spent (completed contracts + released/completed milestones) and number of active contracts (hires) for the authenticated client.",
  })
  @ApiResponse({
    status: 200,
    description: "Dashboard stats retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a client",
  })
  async getClientDashboardStats(@Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    return this.svc.getClientDashboardStats(id);
  }

  @Get("client/active")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get active contracts for client",
    description:
      "Retrieves all active contracts (active, awaiting_payment, or payment_initiated) for the authenticated client.",
  })
  @ApiResponse({
    status: 200,
    description: "Active contracts retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a client",
  })
  async getActiveContractsForClient(@Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    return this.svc.findActiveContractsForClient(id);
  }

  @Post(":id/submit")
  @UseGuards(ActiveFreelancerGuard)
  @UseInterceptors(FilesInterceptor("files", 10))
  @ApiBearerAuth("JWT-auth")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Submit full contract for review",
    description:
      "Submits completed work for a full contract (non-milestone) with optional files, links, and description. Only the freelancer assigned to the contract can submit.",
  })
  @ApiParam({
    name: "id",
    description: "Contract ID",
    type: String,
    example: "ctrct_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description: "Submission description or notes (optional)",
          example: "Completed all project requirements as requested.",
        },
        links: {
          type: "array",
          items: { type: "string" },
          description: "Array of links related to the submission (optional)",
          example: ["https://example.com/project"],
        },
        files: {
          type: "array",
          items: { type: "string", format: "binary" },
          description: "File attachments (max 10 files, 50MB each)",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Contract submitted successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Contract is not active or validation error",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description:
      "Forbidden - User is not a freelancer or not assigned to this contract",
  })
  @ApiResponse({
    status: 404,
    description: "Contract not found",
  })
  async submit(
    @Param("id") contractId: string,
    @Req() request: Request,
    @Body() dto: SubmitContractDto,
    @UploadedFiles(
      new ParseFilePipe({
        validators: [
          new MaxFileSizeValidator({ maxSize: 50 * 1024 * 1024 }), // 50MB
          new FileTypeValidator({
            fileType: /(image|video|application)\/(.*)/,
          }),
        ],
        fileIsRequired: false, // Files are optional
      }),
    )
    files?: Express.Multer.File[],
  ) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });

    return this.svc.submitContract(user, contractId, dto, files || []);
  }

  @Post(":id/submit/approve")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Approve a submitted contract",
    description:
      "Approves a submitted full contract, releases escrowed payment to freelancer, and marks contract as completed.",
  })
  @ApiParam({
    name: "id",
    description: "Contract ID",
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: "Contract submission approved successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Contract cannot be approved",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not the contract owner",
  })
  @ApiResponse({
    status: 404,
    description: "Contract not found",
  })
  async approveSubmission(
    @Param("id") contractId: string,
    @Req() request: Request,
  ) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });
    return this.svc.approveContractSubmission(contractId, user.id);
  }

  @Post(":id/submit/reject")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Reject a submitted contract",
    description:
      "Rejects a submitted full contract, returns it to active status so freelancer can resubmit.",
  })
  @ApiParam({
    name: "id",
    description: "Contract ID",
    type: String,
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Optional reason for rejection",
        },
      },
    },
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "Contract submission rejected successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Contract cannot be rejected",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not the contract owner",
  })
  @ApiResponse({
    status: 404,
    description: "Contract not found",
  })
  async rejectSubmission(
    @Param("id") contractId: string,
    @Req() request: Request,
    @Body() body?: { reason?: string },
  ) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });
    return this.svc.rejectContractSubmission(contractId, user.id, body?.reason);
  }
}
