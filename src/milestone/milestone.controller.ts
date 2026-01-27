import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
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
  ApiBody,
  ApiConsumes,
} from "@nestjs/swagger";
import { FilesInterceptor } from "@nestjs/platform-express";
import { MilestoneService } from "./milestone.service";
import { CreateMilestoneDto } from "./dto/create-milestone.dto";
import { SubmitMilestoneDto } from "./dto/submit-milestone.dto";
import { IsClientGuard } from "src/auth/guards/user-roles/client.guard";
import { IsFreelancerGuard } from "src/auth/guards/user-roles/freelancer.guard";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { Request } from "express";
import { AuthorisedRequest } from "src/common/types";
import { UsersService } from "src/user/user.service";

@ApiTags("Milestones")
@Controller("milestones")
export class MilestoneController {
  constructor(
    private readonly milestoneService: MilestoneService,
    private userService: UsersService,
  ) {}

  // Helper function to transform milestone submissionLinks to links array
  private transformMilestone(milestone: any): any {
    const transformed = { ...milestone };
    if (milestone.submissionLinks) {
      // Split concatenated string into array and return as 'links'
      transformed.links = milestone.submissionLinks.split("|");
    } else {
      transformed.links = [];
    }
    // Keep submissionLinks for backward compatibility but prefer links
    // Recursively transform children if they exist
    if (milestone.children && Array.isArray(milestone.children)) {
      transformed.children = milestone.children.map((child: any) =>
        this.transformMilestone(child),
      );
    }
    return transformed;
  }

  @Post()
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Create a milestone for a contract",
    description:
      "Creates a new milestone for a contract. Only the contract owner (client) can create milestones.",
  })
  @ApiBody({
    type: CreateMilestoneDto,
    description: "Milestone creation data",
  })
  @ApiResponse({
    status: 201,
    description: "Milestone created successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Validation error or milestone amounts exceed contract amount",
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
  async create(@Req() request: Request, @Body() dto: CreateMilestoneDto) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });

    return this.milestoneService.createMilestone(user, dto);
  }

  @Get("contract/:contractId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get all milestones for a contract",
    description:
      "Retrieves all milestones for a specific contract. Both client and freelancer can view milestones for their contracts.",
  })
  @ApiParam({
    name: "contractId",
    description: "Contract ID",
    type: String,
    example: "ctrct_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiResponse({
    status: 200,
    description: "Milestones retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not involved in this contract",
  })
  @ApiResponse({
    status: 404,
    description: "Contract not found",
  })
  async getMilestonesForContract(
    @Param("contractId") contractId: string,
    @Req() request: Request,
  ) {
    const { id } = request.user as AuthorisedRequest;
    const milestones =
      await this.milestoneService.getMilestonesForContract(contractId, id);

    return milestones.map((milestone) => this.transformMilestone(milestone));
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get milestone details",
    description:
      "Retrieves detailed information about a specific milestone. Both client and freelancer can view milestones for their contracts.",
  })
  @ApiParam({
    name: "id",
    description: "Milestone ID",
    type: String,
    example: "mlstn_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiResponse({
    status: 200,
    description: "Milestone details retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 404,
    description: "Milestone not found",
  })
  async getOne(@Param("id") id: string) {
    return this.milestoneService.findOne(id);
  }

  @Post(":id/accept")
  @UseGuards(IsFreelancerGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Accept parent milestone",
    description:
      "Accepts a parent milestone offer. Only the freelancer assigned to the contract can accept parent milestones. Once accepted, the client can initiate payments for child milestones.",
  })
  @ApiParam({
    name: "id",
    description: "Parent Milestone ID",
    type: String,
    example: "mlstn_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiResponse({
    status: 200,
    description: "Parent milestone accepted successfully",
  })
  @ApiResponse({
    status: 400,
    description:
      "Milestone is not a parent milestone or not in PENDING_ACCEPTANCE status",
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
    description: "Parent milestone not found",
  })
  async accept(@Param("id") milestoneId: string, @Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });

    return this.milestoneService.acceptParentMilestone(user, milestoneId);
  }

  @Post(":id/submit")
  @UseGuards(IsFreelancerGuard)
  @UseInterceptors(FilesInterceptor("files", 10))
  @ApiBearerAuth("JWT-auth")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Submit milestone work",
    description:
      "Submits completed work for a child milestone with optional files, links, and description. Only the freelancer assigned to the contract can submit milestones.",
  })
  @ApiParam({
    name: "id",
    description: "Milestone ID",
    type: String,
    example: "mlstn_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        description: {
          type: "string",
          description: "Submission description or notes (optional)",
          example: "Completed all design mockups as requested.",
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
    description: "Milestone submitted successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Milestone is not in APPROVED status or validation error",
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
    description: "Milestone not found",
  })
  async submit(
    @Param("id") milestoneId: string,
    @Req() request: Request,
    @Body() dto: SubmitMilestoneDto,
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

    const milestone = await this.milestoneService.submitMilestone(
      user,
      milestoneId,
      dto,
      files || [],
    );
    return this.transformMilestone(milestone);
  }

  @Post(":id/approve")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Approve a milestone",
    description:
      "Approves a submitted milestone. Only the contract owner (client) can approve milestones.",
  })
  @ApiParam({
    name: "id",
    description: "Milestone ID",
    type: String,
    example: "mlstn_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiResponse({
    status: 200,
    description: "Milestone approved successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Milestone is not in SUBMITTED status",
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
    description: "Milestone not found",
  })
  async approve(@Param("id") milestoneId: string, @Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });

    const milestone = await this.milestoneService.approveMilestone(
      user,
      milestoneId,
    );
    return this.transformMilestone(milestone);
  }

  @Post(":id/reject")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Reject a milestone",
    description:
      "Rejects a submitted milestone and returns it to PENDING status. Only the contract owner (client) can reject milestones.",
  })
  @ApiParam({
    name: "id",
    description: "Milestone ID",
    type: String,
    example: "mlstn_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        reason: {
          type: "string",
          description: "Reason for rejection (optional)",
          example: "Work does not meet requirements",
        },
      },
    },
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "Milestone rejected successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Milestone is not in SUBMITTED status",
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
    description: "Milestone not found",
  })
  async reject(
    @Param("id") milestoneId: string,
    @Req() request: Request,
    @Body() body?: { reason?: string },
  ) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });

    const milestone = await this.milestoneService.rejectMilestone(
      user,
      milestoneId,
      body?.reason,
    );
    return this.transformMilestone(milestone);
  }
}
