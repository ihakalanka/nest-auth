import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { User } from '../schemas/user.model';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(@InjectModel('User') private userModel: Model<User>) {}

  async createUser(user: User): Promise<User> {
    const createdUser = new this.userModel(user);
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
}
