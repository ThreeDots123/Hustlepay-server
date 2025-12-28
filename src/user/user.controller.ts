import { Request } from "express";
import {
  Controller,
  UseGuards,
  Get,
  Req,
  Put,
  Body,
  Query,
  Post,
  UseInterceptors,
  UploadedFile,
  Param,
} from "@nestjs/common";
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
  ApiParam,
  ApiConsumes,
  ApiBody,
} from "@nestjs/swagger";
import { FileInterceptor } from "@nestjs/platform-express";
import { JwtAuthGuard } from "src/auth/guards/jwt.guard";
import { UsersService } from "./user.service";
import { ProfileService } from "src/profile/profile.service";
import transformUserProfile from "src/transformers/user-profile";
import { UserRole } from "src/model/user.entity";
import { AuthorisedRequest } from "src/common/types";
import { ClientProfileDto } from "src/profile/dto/client-profile.dto";
import { UpdateFreelancerProfileDto } from "src/profile/dto/update-freelancer-profile.dto";
import { IsFreelancerGuard } from "src/auth/guards/user-roles/freelancer.guard";
import { IsClientGuard } from "src/auth/guards/user-roles/client.guard";
import transformToAuthenticatedUser from "src/transformers/authenticated-user";

@ApiTags("Users")
@Controller("users")
export class UsersController {
  constructor(
    private readonly usersService: UsersService,
    private profileService: ProfileService,
  ) {}

  @UseGuards(IsFreelancerGuard)
  @Get("freelancer/profile")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get freelancer profile",
    description:
      "Retrieves the authenticated freelancer's complete profile including skills, work experience, portfolio, education, and languages.",
  })
  @ApiResponse({
    status: 200,
    description: "Freelancer profile retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a freelancer",
  })
  async getFreelancerProfile(@Req() request: Request) {
    const { id, role } = request.user as AuthorisedRequest;

    if (role !== UserRole.FREELANCER) return {};

    const user = await this.profileService.retreiveProfile(id, "freelancer");

    if (!user) return {};

    return transformUserProfile(user);
  }

  @UseGuards(IsClientGuard)
  @Get("client/profile")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get client profile",
    description:
      "Retrieves the authenticated client's profile including company name, phone number, country, and industry.",
  })
  @ApiResponse({
    status: 200,
    description: "Client profile retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a client",
  })
  async getClientProfile(@Req() request: Request) {
    const { id, role } = request.user as AuthorisedRequest;

    if (role !== UserRole.CLIENT) return {};

    const user = await this.profileService.retreiveProfile(id, "client");

    if (!user) return {};

    return transformUserProfile(user);
  }

  @UseGuards(IsFreelancerGuard)
  @Put("freelancer/profile")
  @UseInterceptors(FileInterceptor("profilePicture"))
  @ApiBearerAuth("JWT-auth")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Update freelancer profile",
    description:
      "Updates the authenticated freelancer's profile. Supports updating display name, bio, hourly rate, experience level, location, skills, work experiences, portfolios, education, and languages. Can also upload a profile picture.",
  })
  @ApiBody({
    schema: {
      type: "object",
      properties: {
        displayName: { type: "string", example: "John Doe" },
        bio: { type: "string", example: "Experienced web developer" },
        hourlyRate: { type: "number", example: 25.5 },
        experienceLevel: { type: "string", example: "intermediate" },
        location: { type: "string", example: "Lagos, Nigeria" },
        profilePictureUrl: { type: "string", example: "https://..." },
        profilePicture: {
          type: "string",
          format: "binary",
          description: "Profile picture image file",
        },
        skills: {
          type: "string",
          example: '["JavaScript", "TypeScript", "React"]',
          description: "JSON array of skill names",
        },
        workExperiences: {
          type: "string",
          example: '[{"jobTitle":"Developer","company":"Tech Corp"}]',
          description: "JSON array of work experience objects",
        },
        portfolios: {
          type: "string",
          example: '[{"title":"Project 1","description":"..."}]',
          description: "JSON array of portfolio objects",
        },
        educations: {
          type: "string",
          example: '[{"degree":"BSc","school":"University"}]',
          description: "JSON array of education objects",
        },
        languages: {
          type: "string",
          example: '[{"language":"English","proficiency":"Native"}]',
          description: "JSON array of language objects",
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: "Profile updated successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a freelancer",
  })
  async updateFreelancerProfile(
    @Req() request: Request,
    @Body() body: any,
    @UploadedFile() profilePicture?: Express.Multer.File,
  ) {
    const { id } = request.user as AuthorisedRequest;

    // Parse FormData body
    const dto: UpdateFreelancerProfileDto = {
      displayName: body.displayName,
      bio: body.bio,
      hourlyRate: body.hourlyRate ? parseFloat(body.hourlyRate) : undefined,
      experienceLevel: body.experienceLevel,
      location: body.location,
      profilePictureUrl: body.profilePictureUrl,
      skills: body.skills ? JSON.parse(body.skills) : undefined,
      workExperiences: body.workExperiences
        ? JSON.parse(body.workExperiences)
        : undefined,
      portfolios: body.portfolios ? JSON.parse(body.portfolios) : undefined,
      educations: body.educations ? JSON.parse(body.educations) : undefined,
      languages: body.languages ? JSON.parse(body.languages) : undefined,
    };

    const profile = await this.profileService.updateFullFreelancerProfile(
      id,
      dto,
      profilePicture,
    );

    return profile;
  }

  @UseGuards(IsFreelancerGuard)
  @Post("freelancer/profile/upload-portfolio-image")
  @UseInterceptors(FileInterceptor("image"))
  @ApiBearerAuth("JWT-auth")
  @ApiConsumes("multipart/form-data")
  @ApiOperation({
    summary: "Upload portfolio image",
    description:
      "Uploads an image for the freelancer's portfolio. Returns the URL of the uploaded image.",
  })
  @ApiBody({
    schema: {
      type: "object",
      required: ["image"],
      properties: {
        image: {
          type: "string",
          format: "binary",
          description: "Portfolio image file",
        },
      },
    },
  })
  @ApiResponse({
    status: 201,
    description: "Image uploaded successfully",
    schema: {
      type: "object",
      properties: {
        imageUrl: {
          type: "string",
          example: "https://res.cloudinary.com/...",
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a freelancer",
  })
  async uploadPortfolioImage(
    @Req() request: Request,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const { id } = request.user as AuthorisedRequest;
    const imageUrl = await this.profileService.uploadPortfolioImage(id, file);
    return { imageUrl };
  }

  @UseGuards(IsClientGuard)
  @Put("client/profile")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Update client profile",
    description:
      "Updates the authenticated client's profile including company name, phone number, country, and industry.",
  })
  @ApiBody({
    type: ClientProfileDto,
    description: "Client profile data",
  })
  @ApiResponse({
    status: 200,
    description: "Profile updated successfully",
    schema: {
      type: "string",
      example: "updated",
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
  async updateClientProfile(
    @Req() request: Request,
    @Body() _body: ClientProfileDto,
  ) {
    const { id } = request.user as AuthorisedRequest;
    await this.profileService.updateClientProfile(id, _body);

    return "updated";
  }

  @UseGuards(JwtAuthGuard)
  @Get("me")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get current user details",
    description:
      "Retrieves the authenticated user's basic information including id, email, name, role, and verification status.",
  })
  @ApiResponse({
    status: 200,
    description: "User details retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  async getUserDetails(@Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    const user = await this.usersService.findSingleUser({
      where: { id },
    });

    return transformToAuthenticatedUser(user);
  }

  @UseGuards(IsClientGuard)
  @Get("freelancers")
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Search and filter freelancers",
    description:
      "Retrieves a paginated list of freelancers with optional filtering by skills, experience level, hourly rate range, and search query. Only accessible to clients.",
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
    name: "experienceLevel",
    required: false,
    type: String,
    description: "Filter by experience level",
    example: "intermediate",
  })
  @ApiQuery({
    name: "hourlyRateMin",
    required: false,
    type: Number,
    description: "Minimum hourly rate",
    example: 10,
  })
  @ApiQuery({
    name: "hourlyRateMax",
    required: false,
    type: Number,
    description: "Maximum hourly rate",
    example: 100,
  })
  @ApiQuery({
    name: "query",
    required: false,
    type: String,
    description: "Search query for freelancer name or bio",
    example: "web developer",
  })
  @ApiResponse({
    status: 200,
    description: "List of freelancers retrieved successfully",
  })
  @ApiResponse({
    status: 401,
    description: "Unauthorized - Invalid or missing JWT token",
  })
  @ApiResponse({
    status: 403,
    description: "Forbidden - User is not a client",
  })
  async getFreelancers(
    @Query("page") page: number,
    @Query("limit") limit: number,
    @Query("skill") skill: string,
    @Query("skills") skills: string | string[],
    @Query("experienceLevel") experienceLevel: string,
    @Query("hourlyRateMin") hourlyRateMin: number,
    @Query("hourlyRateMax") hourlyRateMax: number,
    @Query("query") query: string,
  ) {
    // Parse array query parameters
    const skillsArray = Array.isArray(skills)
      ? skills
      : skills
        ? skills.split(",").map((s) => s.trim())
        : undefined;

    return this.profileService.findFreelancers({
      page: Number(page) || 1,
      limit: Number(limit) || 20,
      skill,
      skills: skillsArray,
      experienceLevel,
      hourlyRateMin: hourlyRateMin ? Number(hourlyRateMin) : undefined,
      hourlyRateMax: hourlyRateMax ? Number(hourlyRateMax) : undefined,
      query: query ? query.trim() : undefined,
    });
  }

  @Get("freelancers/:id")
  @UseGuards(IsClientGuard)
  @ApiBearerAuth("JWT-auth")
  @ApiOperation({
    summary: "Get freelancer profile by ID",
    description:
      "Retrieves a specific freelancer's complete profile by their user ID. Only accessible to clients.",
  })
  @ApiParam({
    name: "id",
    description: "Freelancer user ID",
    type: String,
    example: "01ARZ3NDEKTSV4RRFFQ69G5FAV",
  })
  @ApiResponse({
    status: 200,
    description: "Freelancer profile retrieved successfully",
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
    description: "Freelancer not found",
  })
  async getFreelancerProfileById(@Param("id") id: string) {
    const profile = await this.profileService.getFreelancerProfileById(id);
    return transformUserProfile(profile);
  }
}
