import { Module, forwardRef } from "@nestjs/common";
import { DeliverableService } from "./deliverable.service";
import { DeliverableController } from "./deliverable.controller";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Deliverable } from "src/model/deliverable.entity";
import { Contract } from "src/model/contract.entity";
import { Milestone } from "src/model/milestone.entity";
import { UserModule } from "src/user/user.module";

@Module({
  imports: [
    TypeOrmModule.forFeature([Deliverable, Contract, Milestone]),
    forwardRef(() => UserModule),
  ],
  providers: [DeliverableService],
  controllers: [DeliverableController],
  exports: [DeliverableService],
})
export class DeliverableModule {}

