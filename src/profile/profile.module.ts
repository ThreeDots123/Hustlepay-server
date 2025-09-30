import { Module } from "@nestjs/common";
import { ProfileService } from "./profile.service";
import { TypeOrmModule } from "@nestjs/typeorm";
import { FreelancerProfile } from "src/model/freelancer-profile.entity";
import { ClientProfile } from "src/model/client-profile.entity";

@Module({
  imports: [
    TypeOrmModule.forFeature([FreelancerProfile]),
    TypeOrmModule.forFeature([ClientProfile]),
  ],
  providers: [ProfileService],
  exports: [ProfileService],
})
export class ProfileModule {}
