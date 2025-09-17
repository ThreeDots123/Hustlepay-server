import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, FindOptionsWhere, Repository } from "typeorm";
import { User as UserEntity } from "src/model/user.entity";
import { CreateUserDto } from "src/user/dto/create-user-pswrd.dto";
import BaseService from "src/interface/service/base.service";
import { userEmailAlreadyExists } from "src/constants/response-messages";

@Injectable()
export class UsersService extends BaseService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
  ) {
    super();
  }

  async createUser(
    userData: Omit<CreateUserDto, "password">,
    transactionalEntity?: EntityManager | undefined,
  ) {
    const newUserInstance = this.usersRepository.create({ ...userData });

    try {
      const user = await this.performEntityOps<UserEntity, UserEntity>({
        repositoryManager: this.usersRepository,
        transactionalEntity,
        action: "save",
        opsArgs: [newUserInstance],
      });

      // Create extra table for extra records (like profile)
      // await this.createUserProfile(user, transactionalEntity);

      return user;
    } catch (err) {
      if (
        (err.message as string).includes(
          "duplicate key value violates unique constraint",
        )
      )
        throw new BadRequestException(userEmailAlreadyExists);
      throw new InternalServerErrorException(err.message);
    }
  }

  async findSingleUser(
    options?: {
      relations?: Array<string>;
      where?: FindOptionsWhere<UserEntity> | FindOptionsWhere<UserEntity>[];
    },
    transactionalEntity?: EntityManager | undefined,
  ) {
    return this.performEntityOps<UserEntity, UserEntity>({
      repositoryManager: this.usersRepository,
      transactionalEntity,
      action: "findOne",
      opsArgs: [
        UserEntity,
        {
          ...(options?.where && { where: options.where }),
          ...(options?.relations && { relations: options.relations }),
        },
      ],
    });
  }

  async updateUserLogin(
    userId: string,
    transactionalEntity?: EntityManager | undefined,
  ) {
    transactionalEntity?.update(UserEntity, { id: userId }, { lastLogin: "" });
    await this.performEntityOps<UserEntity, UserEntity>({
      repositoryManager: this.usersRepository,
      transactionalEntity,
      action: "update",
      opsArgs: [UserEntity, { id: userId }, { lastLogin: new Date() }],
    });
  }

  async findUserById(id: any): Promise<UserEntity | null> {
    const checkUser = await this.usersRepository.findOne({ where: { id: id } });
    if (!checkUser)
      throw new NotFoundException(`User  with this Id: ${id} not found`);
    return checkUser;
  }
}
