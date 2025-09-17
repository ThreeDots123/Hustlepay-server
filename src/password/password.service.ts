import { Injectable } from "@nestjs/common";
import { EntityManager, Repository } from "typeorm";
import { InjectRepository } from "@nestjs/typeorm";
import * as bcrypt from "bcrypt";
import BaseService from "src/interface/service/base.service";
import { CreateUserDto } from "src/user/dto/create-user-pswrd.dto";
import { Password as PasswordEntity } from "src/model/user-password.entity";

@Injectable()
export class PasswordService extends BaseService {
  constructor(
    @InjectRepository(PasswordEntity)
    private passwordRepository: Repository<PasswordEntity>,
  ) {
    super();
  }
  async hashPassword(password: string) {
    return bcrypt.hash(password, 10);
  }

  async comparePasswords(unHashedPsw: string, hashedPsw: string) {
    return bcrypt.compare(unHashedPsw, hashedPsw);
  }

  async createPasswordForUser(
    password: string,
    user: Omit<CreateUserDto, "password">,
    transactionalEntity?: EntityManager,
  ) {
    const passwordInstance = this.passwordRepository.create({
      key: password,
      user,
    });
    const newPassword = await this.performEntityOps<
      PasswordEntity,
      PasswordEntity
    >({
      repositoryManager: this.passwordRepository,
      transactionalEntity,
      action: "save",
      opsArgs: [passwordInstance],
    });

    return newPassword;
  }
}
