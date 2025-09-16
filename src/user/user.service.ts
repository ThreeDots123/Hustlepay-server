import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entities';
import * as bcrypt from 'bcryptjs';
import { SALT_ROUNDS } from 'src/config/env';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User) private usersRepository: Repository<User>,
  ) {}

  async createUser(data: User): Promise<User> {
    const existingUser = await this.usersRepository.findOne({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new ConflictException('Email already exists');
    }

    const saltround = parseInt(`${SALT_ROUNDS}`, 10) || 10;
    const salt = await bcrypt.genSalt(saltround);
    const hashpassword = await bcrypt.hash(data.password, salt);

    const newUser = this.usersRepository.create({
      ...data,
      password: hashpassword,
    });

    return this.usersRepository.save(newUser);
  }

  async findUserByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email: email } });
  }

  async findUserById(id: any): Promise<User | null> {
    const checkUser = await this.usersRepository.findOne({ where: { id: id } });
    if (!checkUser)
      throw new NotFoundException(`User  with this Id: ${id} not found`);
    return checkUser;
  }
}
