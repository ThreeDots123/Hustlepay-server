import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
} from "@nestjs/common";
import { UseGuards } from "@nestjs/common";
import { GigsService } from "./gigs.service";
import { CreateGigDto } from "./dto/create-gig.dto";
import { Request } from "express";
import { IsFreelancerGuard } from "src/auth/guards/user-roles/freelancer.guard";
import { AuthorisedRequest } from "src/common/types";
import transformFreelancerGig from "src/transformers/gig";
import { PaginationDto } from "src/utils/paginition.dto";

@Controller("gigs")
export class GigsController {
  constructor(private readonly gigService: GigsService) {}

  @Post()
  @UseGuards(IsFreelancerGuard)
  async create(@Body() _body: CreateGigDto, @Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    const result = await this.gigService.createGig(_body, id);

    return {
      message: "Gig created successfully",
      gig: transformFreelancerGig(result),
    };
  }

  @Get()
  @UseGuards(IsFreelancerGuard)
  async getAllGigs(
    @Query("page") page = 1,
    @Query("limit") limit = 10,
    @Req() request: Request,
  ) {
    const { id } = request.user as AuthorisedRequest;
    return this.gigService.findAll({ page, limit }, { freelancerId: id });
  }

  @Get("search")
  async search(
    @Query() paginationDto: PaginationDto,
    @Query("keyword") keyword?: string,
    @Query("category") category?: string,
    @Query("minPrice") minPrice?: number,
    @Query("maxPrice") maxPrice?: number,
    @Query("maxDeliveryDays") maxDeliveryDays?: number,
    @Query("tags") tags?: string, // comma separated
  ) {
    const { limit, page } = paginationDto;
    const parsedTags = tags ? tags.split(",") : undefined;
    const result = await this.gigService.searchGig(
      {
        keyword,
        category,
        minPrice,
        maxPrice,
        maxDeliveryDays,
        tags: parsedTags,
      },
      {
        limit,
        page,
        route: "gigs/search",
      },
    );

    return {
      ...result,
      gigs: result.items.map((gig) => transformFreelancerGig(gig)),
      items: undefined,
    };
  }

  @Get(":id")
  @UseGuards(IsFreelancerGuard)
  async getSingleGig(@Param("id") gigId: string, @Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;
    const foundGig = await this.gigService.retrieveSingleGig(gigId, {
      freelancerId: id,
    });

    return transformFreelancerGig(foundGig);
  }

  @Delete(":id")
  @UseGuards(IsFreelancerGuard)
  async remove(@Param("id") gigId: string, @Req() request: Request) {
    const { id } = request.user as AuthorisedRequest;

    await this.gigService.removeGig(gigId, id);

    return {
      message: "Successfully deleted your gig.",
    };
  }
}
