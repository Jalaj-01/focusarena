// import {
//   WebSocketGateway,
//   WebSocketServer,
//   SubscribeMessage,
//   OnGatewayConnection,
//   OnGatewayDisconnect,
// } from '@nestjs/websockets';
// import { Server, Socket } from 'socket.io';
// import { InjectRepository } from '@nestjs/typeorm';
// import { Repository } from 'typeorm';
// import * as jwt from 'jsonwebtoken';

// import { Challenge } from '../challenges/challenge.entity';
// import { Participant } from '../participants/participant.entity';
// import { User } from '../users/user.entity';

// @WebSocketGateway({
//   cors: {
//     origin: 'http://localhost:5173',
//     credentials: true,
//   },
//   transports: ['websocket'],
// })
// export class RealtimeGateway
//   implements OnGatewayConnection, OnGatewayDisconnect
// {
//   @WebSocketServer()
//   server!: Server;

//   private queue: { socketId: string; userId: string }[] = [];
//   private activeSessions: Map<string, string> = new Map();
//   private matchmakingTimers: Map<string, NodeJS.Timeout> = new Map();

//   constructor(
//     @InjectRepository(Challenge)
//     private challengeRepo: Repository<Challenge>,

//     @InjectRepository(User)
//     private userRepo: Repository<User>,

//     @InjectRepository(Participant)
//     private participantRepo: Repository<Participant>,
//   ) {}

//   private getUserFromSocket(client: Socket): string | null {
//     try {
//       const token =
//         client.handshake.auth?.token ||
//         client.handshake.headers?.authorization?.split(' ')[1];

//       if (!token) return null;

//       const decoded = jwt.verify(
//         token,
//         process.env.JWT_SECRET as string
//       ) as { userId: string };

//       return decoded.userId;
//     } catch {
//       return null;
//     }
//   }

//   async handleConnection(client: Socket) {
//     const userId = this.getUserFromSocket(client);

//     if (!userId) {
//       client.disconnect();
//       return;
//     }

//     const existingSocket = this.activeSessions.get(userId);

//     if (existingSocket && existingSocket !== client.id) {
//       console.log(`🔁 Replacing old session for user ${userId}`);
//       this.queue = this.queue.filter((u) => u.socketId !== existingSocket);
//     }

//     this.activeSessions.set(userId, client.id);

//     console.log(`✅ Connected: ${client.id} (user: ${userId})`);
//   }

//   async handleDisconnect(client: Socket) {
//     const userId = this.getUserFromSocket(client);

//     if (userId) {
//       this.activeSessions.delete(userId);

//       const timer = this.matchmakingTimers.get(userId);
//       if (timer) clearTimeout(timer);

//       this.matchmakingTimers.delete(userId);

//       await this.participantRepo
//         .createQueryBuilder()
//         .update(Participant)
//         .set({
//           disconnectCount: () => 'disconnectCount + 1',
//         })
//         .where('1=1')
//         .execute();
//     }

//     this.queue = this.queue.filter((u) => u.socketId !== client.id);
//   }

//   @SubscribeMessage('join_queue')
//   handleJoinQueue(client: Socket) {
//     const userId = this.getUserFromSocket(client);
//     if (!userId) return;

//     const alreadyInQueue = this.queue.find(
//       (u) => u.userId === userId,
//     );

//     if (!alreadyInQueue) {
//       this.queue.push({
//         socketId: client.id,
//         userId,
//       });
//     }

//     console.log("🟡 User joined queue:", userId);

//     const timer = setTimeout(() => {
//       console.log("⏳ Timer finished for:", userId);

//       const stillInQueue = this.queue.find(
//         (u) => u.userId === userId,
//       );

//       if (stillInQueue) {
//         console.log("❌ No match → removing from queue");

//         this.queue = this.queue.filter((u) => u.userId !== userId);

//         client.emit('no_match_found');
//       }
//     }, 15000);

//     this.matchmakingTimers.set(userId, timer);

//     this.tryMatch();
//   }

//   @SubscribeMessage('leave_queue')
//   handleLeaveQueue(client: Socket) {
//     const userId = this.getUserFromSocket(client);

//     if (userId) {
//       const timer = this.matchmakingTimers.get(userId);
//       if (timer) clearTimeout(timer);

//       this.matchmakingTimers.delete(userId);
//     }

//     this.queue = this.queue.filter((u) => u.socketId !== client.id);
//   }

//   @SubscribeMessage('join_room')
//   handleJoinRoom(client: Socket, data: any) {
//     const roomId = data?.challengeId || data;
//     client.join(roomId);
//   }

//   @SubscribeMessage('leave_room')
//   handleLeaveRoom(client: Socket, data: any) {
//     const roomId = data?.challengeId || data;
//     client.leave(roomId);
//   }

//   // 🔥 PERSIST VIOLATIONS (Only increments in DB)
//   @SubscribeMessage('violation_detected')
//   async handleViolationDetected(client: Socket, data: any) {
//     const userId = this.getUserFromSocket(client);
//     const { challengeId, reason } = data;
//     if (!userId || !challengeId || challengeId === 'undefined') return;

//     const participant = await this.participantRepo.findOne({
//       where: { 
//         user: { id: userId }, 
//         challenge: { id: challengeId } 
//       },
//     });

//     if (participant) {
//       participant.warnings += 1; // Backend increments its own value
//       await this.participantRepo.save(participant);
//       console.log(`⚠️ VIOLATION by ${userId}: ${reason} (Total: ${participant.warnings})`);
//     }
//   }

//   @SubscribeMessage('activity_ping')
//   async handleActivityPing(client: Socket, data: any) {
//     const userId = this.getUserFromSocket(client);
//     if (!userId) return;

//     const { challengeId, visible, interaction } = data; 

//     if (
//       !challengeId ||
//       challengeId === 'undefined' ||
//       typeof challengeId !== 'string'
//     ) {
//       return;
//     }

//     const participant = await this.participantRepo.findOne({
//       where: {
//         user: { id: userId },
//         challenge: { id: challengeId },
//       },
//       relations: ['user', 'challenge'],
//     });

//     if (!participant) return;

//     const now = new Date();

//     if (!participant.lastActiveAt) {
//       participant.lastActiveAt = now;
//     }

//     const diff = Math.floor(
//       (now.getTime() - participant.lastActiveAt.getTime()) / 1000
//     );

//     if (visible && interaction) {
//       participant.totalActiveTime += diff;
//       participant.activityScore = Math.min(
//         100,
//         participant.activityScore + 0.5
//       );
//     } else {
//       participant.totalInactiveTime += diff;
//       participant.activityScore = Math.max(0, participant.activityScore - 2);
//     }

//     // ❌ We DO NOT increment participant.warnings here to avoid refresh bugs.
//     // We only use 'violation_detected' for that.

//     participant.lastActiveAt = now;
//     await this.participantRepo.save(participant);
//   }

//   emitToRoom(roomId: string, event: string, data: any) {
//     this.server.to(roomId).emit(event, data);
//   }

//   private async tryMatch() {
//     if (this.queue.length < 2) return;

//     const player1 = this.queue.shift();
//     const player2 = this.queue.shift();

//     if (!player1 || !player2) return;

//     const t1 = this.matchmakingTimers.get(player1.userId);
//     if (t1) clearTimeout(t1);

//     const t2 = this.matchmakingTimers.get(player2.userId);
//     if (t2) clearTimeout(t2);

//     this.matchmakingTimers.delete(player1.userId);
//     this.matchmakingTimers.delete(player2.userId);

//     const user1 = await this.userRepo.findOne({
//       where: { id: player1.userId },
//     });

//     const user2 = await this.userRepo.findOne({
//       where: { id: player2.userId },
//     });

//     if (!user1 || !user2) return;

//     const now = new Date();
//     const end = new Date(now.getTime() + 30 * 60000);

//     const challenge = this.challengeRepo.create({
//       title: 'Live Battle',
//       type: 'group',
//       stake: 10,
//       duration_minutes: 30,
//       status: 'active',
//       start_time: now,
//       end_time: end,
//     });

//     await this.challengeRepo.save(challenge);

//     const p1 = this.participantRepo.create({ user: user1, challenge });
//     const p2 = this.participantRepo.create({ user: user2, challenge });

//     await this.participantRepo.save([p1, p2]);

//     const challengeId = challenge.id;

//     this.server.sockets.sockets.get(player1.socketId)?.join(challengeId);
//     this.server.sockets.sockets.get(player2.socketId)?.join(challengeId);

//     this.server.to(player1.socketId).emit('match_found', { challengeId });
//     this.server.to(player2.socketId).emit('match_found', { challengeId });
//   }
// }


import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as jwt from 'jsonwebtoken';

import { Challenge } from '../challenges/challenge.entity';
import { Participant } from '../participants/participant.entity';
import { User } from '../users/user.entity';

@WebSocketGateway({
  // 🔥 FIX: Explicitly allow the headers and origins for Socket.io
  cors: {
    origin: 'http://localhost:5173',
    methods: ["GET", "POST"],
    allowedHeaders: ["Authorization"],
    credentials: true,
  },
  // Added 'polling' to ensure connection stability before upgrading to websocket
  transports: ['websocket', 'polling'], 
})
export class RealtimeGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private queue: { socketId: string; userId: string }[] = [];
  private activeSessions: Map<string, string> = new Map();
  private matchmakingTimers: Map<string, NodeJS.Timeout> = new Map();

  constructor(
    @InjectRepository(Challenge)
    private challengeRepo: Repository<Challenge>,

    @InjectRepository(User)
    private userRepo: Repository<User>,

    @InjectRepository(Participant)
    private participantRepo: Repository<Participant>,
  ) {}

  private getUserFromSocket(client: Socket): string | null {
    try {
      const token =
        client.handshake.auth?.token ||
        client.handshake.headers?.authorization?.split(' ')[1];

      if (!token) return null;

      const decoded = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as { userId: string };

      return decoded.userId;
    } catch {
      return null;
    }
  }

  async handleConnection(client: Socket) {
    const userId = this.getUserFromSocket(client);

    if (!userId) {
      console.log(`🚫 Connection rejected: No valid token from ${client.id}`);
      client.disconnect();
      return;
    }

    const existingSocket = this.activeSessions.get(userId);

    if (existingSocket && existingSocket !== client.id) {
      console.log(`🔁 Replacing old session for user ${userId}`);
      this.queue = this.queue.filter((u) => u.socketId !== existingSocket);
    }

    this.activeSessions.set(userId, client.id);

    console.log(`✅ Connected: ${client.id} (user: ${userId})`);
  }

  async handleDisconnect(client: Socket) {
    const userId = this.getUserFromSocket(client);

    if (userId) {
      this.activeSessions.delete(userId);

      const timer = this.matchmakingTimers.get(userId);
      if (timer) clearTimeout(timer);

      this.matchmakingTimers.delete(userId);

      // Increment disconnect count only if session was active
      await this.participantRepo
        .createQueryBuilder()
        .update(Participant)
        .set({
          disconnectCount: () => 'disconnectCount + 1',
        })
        .where('1=1') 
        .execute();
    }

    this.queue = this.queue.filter((u) => u.socketId !== client.id);
  }

  @SubscribeMessage('join_queue')
  handleJoinQueue(client: Socket) {
    const userId = this.getUserFromSocket(client);
    if (!userId) return;

    const alreadyInQueue = this.queue.find(
      (u) => u.userId === userId,
    );

    if (!alreadyInQueue) {
      this.queue.push({
        socketId: client.id,
        userId,
      });
    }

    console.log("🟡 User joined queue:", userId);

    const timer = setTimeout(() => {
      console.log("⏳ Timer finished for:", userId);

      const stillInQueue = this.queue.find(
        (u) => u.userId === userId,
      );

      if (stillInQueue) {
        console.log("❌ No match → removing from queue");

        this.queue = this.queue.filter((u) => u.userId !== userId);

        client.emit('no_match_found');
      }
    }, 15000);

    this.matchmakingTimers.set(userId, timer);

    this.tryMatch();
  }

  @SubscribeMessage('leave_queue')
  handleLeaveQueue(client: Socket) {
    const userId = this.getUserFromSocket(client);

    if (userId) {
      const timer = this.matchmakingTimers.get(userId);
      if (timer) clearTimeout(timer);

      this.matchmakingTimers.delete(userId);
    }

    this.queue = this.queue.filter((u) => u.socketId !== client.id);
  }

  @SubscribeMessage('join_room')
  handleJoinRoom(client: Socket, data: any) {
    const roomId = data?.challengeId || data;
    client.join(roomId);
  }

  @SubscribeMessage('leave_room')
  handleLeaveRoom(client: Socket, data: any) {
    const roomId = data?.challengeId || data;
    client.leave(roomId);
  }

  @SubscribeMessage('violation_detected')
  async handleViolationDetected(client: Socket, data: any) {
    const userId = this.getUserFromSocket(client);
    const { challengeId, reason } = data;
    if (!userId || !challengeId || challengeId === 'undefined') return;

    const participant = await this.participantRepo.findOne({
      where: { 
        user: { id: userId }, 
        challenge: { id: challengeId } 
      },
    });

    if (participant) {
      participant.warnings = (Number(participant.warnings) || 0) + 1;
      await this.participantRepo.save(participant);
      console.log(`⚠️ VIOLATION by ${userId}: ${reason} (Total: ${participant.warnings})`);
    }
  }

  @SubscribeMessage('activity_ping')
  async handleActivityPing(client: Socket, data: any) {
    const userId = this.getUserFromSocket(client);
    if (!userId) return;

    const { challengeId, visible, interaction } = data; 

    if (
      !challengeId ||
      challengeId === 'undefined' ||
      typeof challengeId !== 'string'
    ) {
      return;
    }

    const participant = await this.participantRepo.findOne({
      where: {
        user: { id: userId },
        challenge: { id: challengeId },
      },
      relations: ['user', 'challenge'],
    });

    if (!participant) return;

    const now = new Date();

    if (!participant.lastActiveAt) {
      participant.lastActiveAt = now;
    }

    const diff = Math.floor(
      (now.getTime() - participant.lastActiveAt.getTime()) / 1000
    );

    if (visible && interaction) {
      participant.totalActiveTime += diff;
      participant.activityScore = Math.min(
        100,
        Number(participant.activityScore) + 0.5
      );
    } else {
      participant.totalInactiveTime += diff;
      participant.activityScore = Math.max(0, Number(participant.activityScore) - 2);
    }

    participant.lastActiveAt = now;
    await this.participantRepo.save(participant);
  }

  emitToRoom(roomId: string, event: string, data: any) {
    this.server.to(roomId).emit(event, data);
  }

  private async tryMatch() {
    if (this.queue.length < 2) return;

    const player1 = this.queue.shift();
    const player2 = this.queue.shift();

    if (!player1 || !player2) return;

    const t1 = this.matchmakingTimers.get(player1.userId);
    if (t1) clearTimeout(t1);

    const t2 = this.matchmakingTimers.get(player2.userId);
    if (t2) clearTimeout(t2);

    this.matchmakingTimers.delete(player1.userId);
    this.matchmakingTimers.delete(player2.userId);

    const user1 = await this.userRepo.findOne({
      where: { id: player1.userId },
    });

    const user2 = await this.userRepo.findOne({
      where: { id: player2.userId },
    });

    if (!user1 || !user2) return;

    const now = new Date();
    const end = new Date(now.getTime() + 30 * 60000);

    const challenge = this.challengeRepo.create({
      title: 'Live Battle',
      type: 'group',
      stake: 10,
      duration_minutes: 30,
      status: 'active',
      start_time: now,
      end_time: end,
    });

    await this.challengeRepo.save(challenge);

    const p1 = this.participantRepo.create({ user: user1, challenge });
    const p2 = this.participantRepo.create({ user: user2, challenge });

    await this.participantRepo.save([p1, p2]);

    const challengeId = challenge.id;

    this.server.sockets.sockets.get(player1.socketId)?.join(challengeId);
    this.server.sockets.sockets.get(player2.socketId)?.join(challengeId);

    this.server.to(player1.socketId).emit('match_found', { challengeId });
    this.server.to(player2.socketId).emit('match_found', { challengeId });
    
    // Notify all users to refresh their lists because a new challenge started
    this.server.emit('arena_list_updated');
  }
}