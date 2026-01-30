import {
  Controller,
  Post,
  Body,
  UseGuards,
  Req,
  Param,
  Get,
  Delete,
  Patch,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { DeliverableService } from "./deliverable.service";
import { CreateDeliverableDto } from "./dto/create-deliverable.dto";
import { IsClientGuard } from "src/auth/guards/user-roles/client.guard";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { Request } from "express";
import { AuthorisedRequest } from "src/common/types";
import { UsersService } from "src/user/user.service";
import { DeliverableStatus } from "src/model/deliverable.entity";

@ApiTags("Deliverables")
@Controller("deliverables")
export class DeliverableController {
  constructor(
    private readonly deliverableService: DeliverableService,
    private userService: UsersService,
  ) {}

  @Post()
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Create a deliverable",
    description:
      "Creates a deliverable for either a contract (full payment) or a milestone. Only the contract owner (client) can create deliverables.",
  })
  @ApiBody({
    type: CreateDeliverableDto,
    description: "Deliverable creation data",
  })
  @ApiResponse({
    status: 201,
    description: "Deliverable created successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Validation error",
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
    description: "Contract or milestone not found",
  })
  async create(@Req() request: Request, @Body() dto: CreateDeliverableDto) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });

    return this.deliverableService.createDeliverable(user, dto);
  }

  @Get("contract/:contractId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get deliverables for a contract",
    description:
      "Retrieves all deliverables associated with a contract (not milestone-specific). Both client and freelancer can view deliverables.",
  })
  @ApiParam({
    name: "contractId",
    description: "Contract ID",
    type: String,
    example: "ctrct_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiResponse({
    status: 200,
    description: "Deliverables retrieved successfully",
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
  async getDeliverablesForContract(
    @Param("contractId") contractId: string,
    @Req() request: Request,
  ) {
    const { id } = request.user as AuthorisedRequest;
    return this.deliverableService.getDeliverablesForContract(contractId, id);
  }

  @Get("milestone/:milestoneId")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get deliverables for a milestone",
    description:
      "Retrieves all deliverables associated with a specific milestone. Both client and freelancer can view deliverables.",
  })
  @ApiParam({
    name: "milestoneId",
    description: "Milestone ID",
    type: String,
    example: "mlstn_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiResponse({
    status: 200,
    description: "Deliverables retrieved successfully",
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
    description: "Milestone not found",
  })
  async getDeliverablesForMilestone(
    @Param("milestoneId") milestoneId: string,
    @Req() request: Request,
  ) {
    const { id } = request.user as AuthorisedRequest;
    return this.deliverableService.getDeliverablesForMilestone(milestoneId, id);
  }

  @Get(":id")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get deliverable details",
    description:
      "Retrieves detailed information about a specific deliverable. Both client and freelancer can view deliverables.",
  })
  @ApiParam({
    name: "id",
    description: "Deliverable ID",
    type: String,
    example: "dlvr_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiResponse({
    status: 200,
    description: "Deliverable details retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 404,
    description: "Deliverable not found",
  })
  async getOne(@Param("id") id: string) {
    return this.deliverableService.findOne(id);
  }

  @Patch(":id/status")
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Update deliverable status",
    description:
      "Updates the status of a deliverable. Both client and freelancer can update status (e.g., mark as completed, verified).",
  })
  @ApiParam({
    name: "id",
    description: "Deliverable ID",
    type: String,
    example: "dlvr_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        status: {
          type: "string",
          enum: ["pending", "completed", "verified"],
          example: "completed",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Deliverable status updated successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Invalid status",
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
    description: "Deliverable not found",
  })
  async updateStatus(
    @Param("id") deliverableId: string,
    @Req() request: Request,
    @Body() body: { status: DeliverableStatus },
  ) {
    const { id } = request.user as AuthorisedRequest;
    return this.deliverableService.updateDeliverableStatus(
      id,
      deliverableId,
      body.status,
    );
  }

  @Delete(":id")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Delete a deliverable",
    description:
      "Deletes a deliverable. Only the contract owner (client) can delete deliverables.",
  })
  @ApiParam({
    name: "id",
    description: "Deliverable ID",
    type: String,
    example: "dlvr_01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiResponse({
    status: 200,
    description: "Deliverable deleted successfully",
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
    description: "Deliverable not found",
  })
  async delete(@Param("id") deliverableId: string, @Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });

    return this.deliverableService.deleteDeliverable(user, deliverableId);
  }
}

