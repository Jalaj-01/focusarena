import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../users/user.entity';
import * as bcrypt from 'bcrypt';
import { RegisterDto } from './dto/register.dto';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    private readonly jwtService: JwtService, // ✅ FIXED
  ) {}

  // 🔐 REGISTER
  async register(data: RegisterDto) {
    const { name, email, password } = data;

    const existingUser = await this.userRepo.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new BadRequestException('User already exists');
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = this.userRepo.create({
      name,
      email,
      password_hash: hashedPassword,
    });

    const savedUser = await this.userRepo.save(user);

    // remove password before returning
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { password_hash, ...userWithoutPassword } = savedUser;

    return {
      message: 'User registered successfully',
      user: userWithoutPassword,
    };
  }

  // 🔓 LOGIN
  async login(email: string, password: string) {
    const user = await this.userRepo.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      userId: user.id,
      email: user.email,
    };

    const token = this.jwtService.sign(payload);

    return {
      message: 'Login successful',
      access_token: token,
    };
  }
}
