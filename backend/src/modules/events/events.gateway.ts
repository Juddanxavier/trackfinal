import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, ConnectedSocket, MessageBody } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.replace('Bearer ', '');
      if (token) {
        const payload = this.jwtService.verify(token);
        client.data.user = payload;
        console.log(`Client connected: ${client.id}`, payload.email);
      }
    } catch (err) {
      console.log('WebSocket connection without auth');
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(@ConnectedSocket() client: Socket, @MessageBody() data: any): string {
    return 'Hello world!';
  }

  // Helper to emit to all clients in an organisation
  emitToOrganisation(organisationId: string, event: string, data: any) {
    this.server.to(`org:${organisationId}`).emit(event, data);
  }

  // Helper to emit to specific user
  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  // Join organisation room
  @SubscribeMessage('join-organisation')
  handleJoinOrganisation(@ConnectedSocket() client: Socket, @MessageBody() organisationId: string) {
    client.join(`org:${organisationId}`);
    return { status: 'joined', organisationId };
  }

  // Leave organisation room
  @SubscribeMessage('leave-organisation')
  handleLeaveOrganisation(@ConnectedSocket() client: Socket, @MessageBody() organisationId: string) {
    client.leave(`org:${organisationId}`);
    return { status: 'left', organisationId };
  }
}