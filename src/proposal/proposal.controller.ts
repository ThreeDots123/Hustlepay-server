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
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiBody,
} from "@nestjs/swagger";
import { ProposalService } from "./proposal.service";
import { CreateProposalDto } from "./dto/create-proposal.dto";
import { UpdateProposalDto } from "./dto/update-proposal.dto";
import { AcceptProposalDto } from "./dto/accept-proposal.dto";
import { IsClientGuard } from "src/auth/guards/user-roles/client.guard";
import { request, Request } from "express";
import { AuthorisedRequest } from "src/common/types";
import { UsersService } from "src/user/user.service";
import { IsFreelancerGuard } from "src/auth/guards/user-roles/freelancer.guard";

@ApiTags("Proposals")
@Controller("proposals")
export class ProposalController {
  constructor(
    private readonly svc: ProposalService,
    private userService: UsersService,
  ) {}

  @Post()
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Create a new proposal",
    description:
      "Creates a new job proposal. Only clients can create proposals. Requires title, description, and categories. Budget and skills are optional.",
  })
  @ApiBody({
    type: CreateProposalDto,
    description: "Proposal creation data",
  })
  @ApiResponse({
    status: 201,
    description: "Proposal created successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Validation error - Invalid proposal data",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a client",
  })
  async create(@Req() request: Request, @Body() dto: CreateProposalDto) {
    const { id } = request.user as AuthorisedRequest;
    return this.svc.create(id, dto);
  }

  @Get()
  @ApiOperation({
    summary: "List all proposals",
    description:
      "Retrieves a paginated list of all proposals with optional filtering by skills, budget range, duration, categories, and search query. Public endpoint.",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Number of items per page (default: 20)",
    example: 20,
  })
  @ApiQuery({
    name: "skill",
    required: false,
    type: String,
    description: "Filter by a single skill",
    example: "JavaScript",
  })
  @ApiQuery({
    name: "skills",
    required: false,
    type: String,
    description: "Comma-separated list of skills",
    example: "JavaScript,TypeScript,React",
  })
  @ApiQuery({
    name: "budgetMin",
    required: false,
    type: Number,
    description: "Minimum budget",
    example: 1000,
  })
  @ApiQuery({
    name: "budgetMax",
    required: false,
    type: Number,
    description: "Maximum budget",
    example: 10000,
  })
  @ApiQuery({
    name: "durationMin",
    required: false,
    type: Number,
    description: "Minimum duration in days",
    example: 7,
  })
  @ApiQuery({
    name: "durationMax",
    required: false,
    type: Number,
    description: "Maximum duration in days",
    example: 30,
  })
  @ApiQuery({
    name: "inviteOnly",
    required: false,
    type: String,
    description: "Filter by invite-only status (true/false)",
    example: "false",
  })
  @ApiQuery({
    name: "categories",
    required: false,
    type: String,
    description: "Comma-separated list of categories",
    example: "Web Development,Design",
  })
  @ApiQuery({
    name: "query",
    required: false,
    type: String,
    description: "Search query for proposal title or description",
    example: "web development",
  })
  @ApiResponse({
    status: 200,
    description: "List of proposals retrieved successfully",
  })
  async list(
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Query("skill") skill: string,
    @Query("skills") skills: string | string[],
    @Query("budgetMin") budgetMin: number,
    @Query("budgetMax") budgetMax: number,
    @Query("durationMin") durationMin: number,
    @Query("durationMax") durationMax: number,
    @Query("inviteOnly") inviteOnly: string,
    @Query("categories") categories: string | string[],
    @Query("query") query: string,
    @Req() request: Request,
  ) {
    // Parse array query parameters
    const skillsArray = Array.isArray(skills)
      ? skills
      : skills
        ? skills.split(",").map((s) => s.trim())
        : undefined;

    const categoriesArray = Array.isArray(categories)
      ? categories
      : categories
        ? categories.split(",").map((c) => c.trim())
        : undefined;

    // Parse boolean
    const inviteOnlyBool =
      inviteOnly === "true" ? true : inviteOnly === "false" ? false : undefined;

    return this.svc.findAll({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      skill,
      skills: skillsArray,
      budgetMin: budgetMin ? Number(budgetMin) : undefined,
      budgetMax: budgetMax ? Number(budgetMax) : undefined,
      durationMin: durationMin ? Number(durationMin) : undefined,
      durationMax: durationMax ? Number(durationMax) : undefined,
      inviteOnly: inviteOnlyBool,
      categories: categoriesArray,
      query: query ? query.trim() : undefined,
    });
  }

  @Get("/me")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "List my proposals",
    description:
      "Retrieves a paginated list of proposals created by the authenticated client with optional filtering.",
  })
  @ApiQuery({
    name: "page",
    required: false,
    type: Number,
    description: "Page number (default: 1)",
    example: 1,
  })
  @ApiQuery({
    name: "limit",
    required: false,
    type: Number,
    description: "Number of items per page (default: 20)",
    example: 20,
  })
  @ApiQuery({
    name: "skill",
    required: false,
    type: String,
    description: "Filter by a single skill",
    example: "JavaScript",
  })
  @ApiQuery({
    name: "skills",
    required: false,
    type: String,
    description: "Comma-separated list of skills",
    example: "JavaScript,TypeScript,React",
  })
  @ApiQuery({
    name: "budgetMin",
    required: false,
    type: Number,
    description: "Minimum budget",
    example: 1000,
  })
  @ApiQuery({
    name: "budgetMax",
    required: false,
    type: Number,
    description: "Maximum budget",
    example: 10000,
  })
  @ApiQuery({
    name: "durationMin",
    required: false,
    type: Number,
    description: "Minimum duration in days",
    example: 7,
  })
  @ApiQuery({
    name: "durationMax",
    required: false,
    type: Number,
    description: "Maximum duration in days",
    example: 30,
  })
  @ApiQuery({
    name: "inviteOnly",
    required: false,
    type: String,
    description: "Filter by invite-only status (true/false)",
    example: "false",
  })
  @ApiQuery({
    name: "categories",
    required: false,
    type: String,
    description: "Comma-separated list of categories",
    example: "Web Development,Design",
  })
  @ApiQuery({
    name: "query",
    required: false,
    type: String,
    description: "Search query for proposal title or description",
    example: "web development",
  })
  @ApiResponse({
    status: 200,
    description: "List of user's proposals retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a client",
  })
  async listMyProposals(
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Query("skill") skill: string,
    @Query("skills") skills: string | string[],
    @Query("budgetMin") budgetMin: number,
    @Query("budgetMax") budgetMax: number,
    @Query("durationMin") durationMin: number,
    @Query("durationMax") durationMax: number,
    @Query("inviteOnly") inviteOnly: string,
    @Query("categories") categories: string | string[],
    @Query("query") query: string,
    @Req() request: Request,
  ) {
    const { id } = request.user as AuthorisedRequest;

    // Parse array query parameters
    const skillsArray = Array.isArray(skills)
      ? skills
      : skills
        ? skills.split(",").map((s) => s.trim())
        : undefined;

    const categoriesArray = Array.isArray(categories)
      ? categories
      : categories
        ? categories.split(",").map((c) => c.trim())
        : undefined;

    // Parse boolean
    const inviteOnlyBool =
      inviteOnly === "true" ? true : inviteOnly === "false" ? false : undefined;

    return this.svc.findAll(
      {
        page: Number(page) || 1,
        limit: Number(limit) || 20,
        skill,
        skills: skillsArray,
        budgetMin: budgetMin ? Number(budgetMin) : undefined,
        budgetMax: budgetMax ? Number(budgetMax) : undefined,
        durationMin: durationMin ? Number(durationMin) : undefined,
        durationMax: durationMax ? Number(durationMax) : undefined,
        inviteOnly: inviteOnlyBool,
        categories: categoriesArray,
        query: query ? query.trim() : undefined,
      },
      id,
    );
  }

  @Get("/me/stats/total-proposals")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get total proposals count for client",
    description:
      "Returns the total count of proposals created by the authenticated client.",
  })
  @ApiResponse({
    status: 200,
    description: "Total proposals count retrieved successfully",
    schema: {
      type: "object",
      properties: {
        count: { type: "number" },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a client",
  })
  async getTotalProposalsCount(@Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    const count = await this.svc.countTotalProposalsForClient(id);
    return { count };
  }

  @Get("/me/stats/active-projects")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get active projects count for client",
    description:
      "Returns the count of active (hired) projects for the authenticated client.",
  })
  @ApiResponse({
    status: 200,
    description: "Active projects count retrieved successfully",
    schema: {
      type: "object",
      properties: {
        count: { type: "number" },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a client",
  })
  async getActiveProjectsCount(@Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    const count = await this.svc.countActiveProjectsForClient(id);
    return { count };
  }

  @Get("/me/stats/total-budget")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get total budget for client",
    description:
      "Returns the total budget (sum of all proposal budgets) for the authenticated client.",
  })
  @ApiResponse({
    status: 200,
    description: "Total budget retrieved successfully",
    schema: {
      type: "object",
      properties: {
        total: { type: "number" },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a client",
  })
  async getTotalBudget(@Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    const total = await this.svc.getTotalBudgetForClient(id);
    return { total };
  }

  @Get("/me/stats/total-responses")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get total responses count for client",
    description:
      "Returns the total count of bids and contracts for proposals without active contracts for the authenticated client.",
  })
  @ApiResponse({
    status: 200,
    description: "Total responses count retrieved successfully",
    schema: {
      type: "object",
      properties: {
        count: { type: "number" },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a client",
  })
  async getTotalResponsesCount(@Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    const count = await this.svc.getTotalResponsesForClient(id);
    return { count };
  }

  @Get("/client/:slug")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get proposal details (client view)",
    description:
      "Retrieves detailed information about a specific proposal including all bids. Only accessible to the proposal owner (client).",
  })
  @ApiParam({
    name: "slug",
    description: "Proposal slug identifier",
    type: String,
    example: "web-development-project-2024",
  })
  @ApiResponse({
    status: 200,
    description: "Proposal details retrieved successfully",
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
  retrieveProposalDetailsForClient(
    @Param("slug") slug: string,
    @Req() request: Request,
  ) {
    const { id } = request.user as AuthorisedRequest;
    return this.svc.findOne(slug, { client: id });
  }

  @Get("/freelancer/:slug")
  @UseGuards(IsFreelancerGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get proposal details (freelancer view)",
    description:
      "Retrieves detailed information about a specific proposal for freelancers. Shows proposal details and allows freelancers to see if they've already submitted a bid.",
  })
  @ApiParam({
    name: "slug",
    description: "Proposal slug identifier",
    type: String,
    example: "web-development-project-2024",
  })
  @ApiResponse({
    status: 200,
    description: "Proposal details retrieved successfully",
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
  retrieveProposalDetailsForFreelancer(
    @Param("slug") slug: string,
    @Req() request: Request,
  ) {
    const { id } = request.user as AuthorisedRequest;
    return this.svc.findOne(slug, { freelancer: id });
  }

  @Post(":id/accept")
  @UseGuards(IsFreelancerGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Accept a proposal directly",
    description:
      "Allows a freelancer to accept a proposal directly without submitting a bid. Creates a contract using the proposal's budget. Only freelancers can accept proposals.",
  })
  @ApiParam({
    name: "id",
    description: "Proposal ID to accept",
    type: String,
    example: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiBody({
    type: AcceptProposalDto,
    description:
      "Contract creation data (amount optional, defaults to proposal budget)",
  })
  @ApiResponse({
    status: 201,
    description: "Proposal accepted and contract created successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Validation error or proposal cannot be accepted",
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
  async acceptProposal(
    @Param("id") proposalId: string,
    @Body() dto: AcceptProposalDto,
    @Req() request: Request,
  ) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });
    return this.svc.acceptProposal(user, proposalId, dto.amount, dto.currency);
  }

  @Patch(":id")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Update a proposal",
    description:
      "Updates an existing proposal. Only the proposal owner (client) can update it. All fields are optional.",
  })
  @ApiParam({
    name: "id",
    description: "Proposal ID",
    type: String,
    example: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiBody({
    type: UpdateProposalDto,
    description: "Proposal update data (all fields optional)",
  })
  @ApiResponse({
    status: 200,
    description: "Proposal updated successfully",
  })
  @ApiResponse({
    status: 400,
    description: "Validation error - Invalid proposal data",
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
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Close a proposal",
    description:
      "Closes a proposal, preventing further bids. Only the proposal owner (client) can close it.",
  })
  @ApiParam({
    name: "id",
    description: "Proposal ID",
    type: String,
    example: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiResponse({
    status: 200,
    description: "Proposal closed successfully",
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
  async close(@Param("id") proposalId: string, @Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.userService.findSingleUser({
      where: { id },
    });
    return this.svc.close(proposalId, user);
  }

  @Get("skills/suggest")
  @ApiOperation({
    summary: "Suggest skills",
    description:
      "Returns a list of skill suggestions based on a search query. Useful for autocomplete when creating proposals or profiles.",
  })
  @ApiQuery({
    name: "query",
    required: false,
    type: String,
    description: "Search query for skill names",
    example: "jav",
  })
  @ApiResponse({
    status: 200,
    description: "List of suggested skills",
    schema: {
      type: "array",
      items: {
        type: "object",
        properties: {
          id: { type: "string" },
          name: { type: "string", example: "JavaScript" },
          slug: { type: "string", example: "javascript" },
        },
      },
    },
  })
  async suggestSkills(@Query("query") query: string) {
    return this.svc.suggestSkills(query);
  }
}
