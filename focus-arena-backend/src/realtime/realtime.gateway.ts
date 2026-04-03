import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: true,
})
export class RealtimeGateway {
  @WebSocketServer()
  server: Server;

  // 🔥 JOIN ROOM
  @SubscribeMessage('joinRoom')
  handleJoin(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { challengeId: string },
  ) {
    client.join(data.challengeId);
  }

  // 🔥 EMIT TO ROOM
  emitToRoom(challengeId: string, event: string, payload: any) {
    this.server.to(challengeId).emit(event, payload);
  }
}