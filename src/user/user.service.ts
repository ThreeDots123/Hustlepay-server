import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
  BadRequestException,
} from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, FindOptionsWhere, Repository } from "typeorm";
import {
  AuthMethod,
  User as UserEntity,
  UserRole,
  UserStatus,
} from "src/model/user.entity";
import { Wallet } from "src/model/wallet.entity";
import { CreateUserDto } from "src/user/dto/create-user-pswrd.dto";
import BaseService from "src/interface/service/base.service";
import { userEmailAlreadyExists } from "src/constants/response-messages";
import { ProfileService } from "src/profile/profile.service";

@Injectable()
export class UsersService extends BaseService {
  constructor(
    @InjectRepository(UserEntity)
    private usersRepository: Repository<UserEntity>,
    @InjectRepository(Wallet)
    private walletRepository: Repository<Wallet>,
    private profileService: ProfileService,
  ) {
    super();
  }

  async createUser(
    userData: Omit<CreateUserDto, "password"> & { authMethod?: AuthMethod },
    transactionalEntity?: EntityManager,
  ) {
    const newUserInstance = this.usersRepository.create({
      ...userData,
      status:
        userData.role === UserRole.FREELANCER
          ? UserStatus.PENDING
          : UserStatus.ACTIVE,
    });

    try {
      const user = await this.performEntityOps<UserEntity, UserEntity>({
        repositoryManager: this.usersRepository,
        transactionalEntity,
        action: "save",
        opsArgs: [newUserInstance],
      });

      // Create extra table for extra records (like profile)
      if (user.role === UserRole.CLIENT)
        await this.profileService.createClientProfile(
          user.id,
          transactionalEntity,
        );
      else if (user.role === UserRole.FREELANCER)
        await this.profileService.createFreelacerProfile(
          user.id,
          transactionalEntity,
        );

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
    transactionalEntity?: EntityManager,
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

  async updateUser(
    id: string,
    newRecord: Partial<UserEntity>,
    transactionalEntity?: EntityManager,
  ) {
    await this.performEntityOps<UserEntity, UserEntity>({
      repositoryManager: this.usersRepository,
      transactionalEntity,
      action: "update",
      opsArgs: [UserEntity, { id }, { ...newRecord }],
    });
  }

  async updateUserLogin(userId: string, transactionalEntity?: EntityManager) {
    await this.updateUser(
      userId,
      { lastLogin: new Date() },
      transactionalEntity,
    );
  }

  async findUserById(id: any): Promise<UserEntity | null> {
    const checkUser = await this.usersRepository.findOne({ where: { id: id } });
    if (!checkUser)
      throw new NotFoundException(`User  with this Id: ${id} not found`);
    return checkUser;
  }

  async checkFreelancerWallet(userId: string): Promise<{ hasWallet: boolean }> {
    const wallet = await this.walletRepository.findOne({
      where: { userId },
    });
    return { hasWallet: !!wallet };
  }
}
