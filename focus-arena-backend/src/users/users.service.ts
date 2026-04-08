// import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import { User } from './user.entity';

// @Injectable()
// export class UsersService {
//   private readonly COIN_TO_USD_RATIO = 100; // 100 coins = $1
//   private readonly MIN_WITHDRAW_USD = 20; 
//   private readonly WITHDRAW_BURN_FEE = 50; // 50 coins burned per withdrawal

//   constructor(
//     @InjectRepository(User)
//     private userRepo: Repository<User>,
//   ) {}

//   async getLeaderboard() {
//     const users = await this.userRepo.find({
//       order: { coins: 'DESC' },
//       take: 10,
//     });

//     return users.map((u, index) => ({
//       rank: index + 1,
//       name: u.name,
//       coins: u.coins,
//       xp: u.xp,
//       wins: u.wins,
//       losses: u.losses,
//       streak: u.streak,
//     }));
//   }

//   async getProfile(userId: string) {
//     // 🔥 FIXED: Added relations back so the Dashboard can see your challenges
//     // Note: This WILL crash the server until you perform Step 2 below!
//     return this.userRepo.findOne({
//       where: { id: userId },
//       relations: ['participants', 'participants.challenge'],
//     });
//   }

//   async withdrawCoins(userId: string, amountInCoins: number) {
//     const user = await this.userRepo.findOne({ where: { id: userId } });
//     if (!user) throw new NotFoundException('User not found');

//     const amountInUsd = amountInCoins / this.COIN_TO_USD_RATIO;
    
//     if (amountInUsd < this.MIN_WITHDRAW_USD) {
//         throw new BadRequestException(`Minimum withdrawal is $${this.MIN_WITHDRAW_USD} (${this.MIN_WITHDRAW_USD * this.COIN_TO_USD_RATIO} coins).`);
//     }

//     if (Number(user.coins) < amountInCoins + this.WITHDRAW_BURN_FEE) {
//         throw new BadRequestException('Insufficient balance to cover withdrawal and burn fee.');
//     }

//     await this.userRepo.decrement({ id: user.id }, 'coins', amountInCoins + this.WITHDRAW_BURN_FEE);

//     return { 
//         message: 'Withdrawal initiated', 
//         withdrawn: amountInCoins, 
//         burned: this.WITHDRAW_BURN_FEE 
//     };
//   }
// }
import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';

@Injectable()
export class UsersService {
  private readonly COIN_TO_USD_RATIO = 100; // 100 coins = $1
  private readonly MIN_WITHDRAW_USD = 20; 
  private readonly WITHDRAW_BURN_FEE = 50; // 50 coins burned per withdrawal

  constructor(
    @InjectRepository(User)
    private userRepo: Repository<User>,
  ) {}

  async getLeaderboard() {
    const users = await this.userRepo.find({
      order: { coins: 'DESC' },
      take: 10,
    });

    return users.map((u, index) => ({
      rank: index + 1,
      name: u.name,
      coins: u.coins,
      xp: u.xp,
      wins: u.wins,
      losses: u.losses,
      streak: u.streak,
    }));
  }

  async getProfile(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['participants', 'participants.challenge'],
    });

    if (user && user.participants) {
      // 🔥 FIXED: Filter participants list before sending to frontend.
      // This removes "Ghost" buttons by only showing challenges that are 
      // actually Live (Active/Pending) and NOT archived.
      user.participants = user.participants.filter(p => 
        p.challenge && 
        !p.challenge.is_archived && 
        (p.challenge.status === 'active' || p.challenge.status === 'pending')
      );
    }

    return user;
  }

  async withdrawCoins(userId: string, amountInCoins: number) {
    const user = await this.userRepo.findOne({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const amountInUsd = amountInCoins / this.COIN_TO_USD_RATIO;
    
    if (amountInUsd < this.MIN_WITHDRAW_USD) {
        throw new BadRequestException(`Minimum withdrawal is $${this.MIN_WITHDRAW_USD} (${this.MIN_WITHDRAW_USD * this.COIN_TO_USD_RATIO} coins).`);
    }

    if (Number(user.coins) < amountInCoins + this.WITHDRAW_BURN_FEE) {
        throw new BadRequestException('Insufficient balance to cover withdrawal and burn fee.');
    }

    await this.userRepo.decrement({ id: user.id }, 'coins', amountInCoins + this.WITHDRAW_BURN_FEE);

    return { 
        message: 'Withdrawal initiated', 
        withdrawn: amountInCoins, 
        burned: this.WITHDRAW_BURN_FEE 
    };
  }
}