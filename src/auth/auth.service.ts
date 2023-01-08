import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.model';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt/dist';

@Injectable()
export class AuthService {
  constructor(
    @InjectModel('User') private userModel: Model<User>,
    private jwtService: JwtService,
  ) {}

  async createUser(user: User): Promise<User> {
    const createdUser = new this.userModel(user);
    if (
      !createdUser.firstName ||
      !createdUser.lastName ||
      !createdUser.email ||
      !createdUser.password ||
      !createdUser.role
    ) {
      throw new BadRequestException('All fields are required');
    }
    this.validatePassword(createdUser.password);
    this.validateEmail(createdUser.email);
    const salt = await bcrypt.genSalt(10);
    const hash = await bcrypt.hash(createdUser.password, salt);
    createdUser.password = hash;
    const userExists = await this.userModel.findOne({ email: user.email });
    if (userExists) {
      throw new BadRequestException('User already exists');
    } else {
      return await createdUser.save();
    }
  }

  validatePassword(password: string) {
    if (password.length < 6) {
      throw new BadRequestException(
        'Password must be at least 6 characters long',
      );
    } else if (password.length > 15) {
      throw new BadRequestException(
        'Password must be less than 15 characters long',
      );
    } else if (!password.match(/[a-z]/)) {
      throw new BadRequestException(
        'Password must contain at least one lowercase letter',
      );
    } else if (!password.match(/[A-Z]/)) {
      throw new BadRequestException(
        'Password must contain at least one uppercase letter',
      );
    } else if (!password.match(/[0-9]/)) {
      throw new BadRequestException(
        'Password must contain at least one number',
      );
    } else if (!password.match(/[!@#$%^&*]/)) {
      throw new BadRequestException(
        'Password must contain at least one special character',
      );
    } else if (password.match(/\s/)) {
      throw new BadRequestException('Password must not contain any spaces');
    } else {
      return true;
    }
  }

  validateEmail(email: string) {
    const emailRegex =
      /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
    if (emailRegex.test(email)) {
      return true;
    } else {
      throw new BadRequestException('Email is not valid');
    }
  }

  async login(user: User): Promise<any> {
    const foundUser = await this.userModel.findOne({ email: user.email });
    if (!foundUser) {
      throw new BadRequestException('User not found');
    }
    const isMatch = await bcrypt.compare(user.password, foundUser.password);
    if (!isMatch) {
      throw new BadRequestException('Invalid credentials');
    }
    const payload = { role: user.role, name: user.firstName };
    const token = this.jwtService.sign(payload);
    return { token, message: 'Login successful' };
  }
}
