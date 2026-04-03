import { Injectable } from '@nestjs/common';

@Injectable()
export class FriendsService {
  invite(friendId: string) {
    return { message: `Invite sent to ${friendId}` };
  }
}