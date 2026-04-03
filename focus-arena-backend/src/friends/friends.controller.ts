import { Controller, Post, Param } from '@nestjs/common';
import { FriendsService } from './friends.service';

@Controller('friends')
export class FriendsController {
  constructor(private friendsService: FriendsService) {}

  @Post('invite/:id')
  invite(@Param('id') id: string) {
    return this.friendsService.invite(id);
  }
}