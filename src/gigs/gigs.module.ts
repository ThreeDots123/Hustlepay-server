import { Module } from "@nestjs/common";
import { GigsController } from "./gigs.controller";
import { GigsService } from "./gigs.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Gig } from "src/model/gig.entity";
import { GigMedia } from "src/model/gig-media.entity";
import { GigPackage } from "src/model/gig-package.entity";

@Module({
  imports: [TypeOrmModule.forFeature([Gig, GigMedia, GigPackage])],
  controllers: [GigsController],
  providers: [GigsService],
})
export class GigsModule {}
