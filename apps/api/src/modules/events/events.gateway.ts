import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { Logger } from '@nestjs/common';
import { UsersService } from '../users/services';
import { isAdminRole } from '../../common/enums/role.enum';

@WebSocketGateway({
  cors: {
    origin: process.env.CORS_ORIGINS?.split(',') || ['http://localhost:3000'],
    credentials: true,
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  private readonly logger = new Logger(EventsGateway.name);

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async handleConnection(client: Socket) {
    const token =
      client.handshake.auth?.token ||
      client.handshake.headers?.authorization?.replace('Bearer ', '');

    if (!token) {
      this.logger.warn(`Client ${client.id} connected without token`);
      client.emit('error', { message: 'Authentication required' });
      client.disconnect(true);
      return;
    }

    try {
      const payload = this.jwtService.verify(token);

      if (!payload || !payload.sub) {
        throw new Error('Invalid token payload');
      }

      const user = await this.usersService.findById(payload.sub);

      if (!user) {
        this.logger.warn(`Client ${client.id} - user ${payload.sub} not found`);
        client.emit('error', { message: 'User not found' });
        client.disconnect(true);
        return;
      }

      if (!user.isActive) {
        this.logger.warn(
          `Client ${client.id} - user ${payload.sub} is inactive`,
        );
        client.emit('error', { message: 'Account is deactivated' });
        client.disconnect(true);
        return;
      }

      client.data.user = {
        id: payload.sub,
        email: payload.email,
        role: payload.role,
        organisationId: payload.organisationId,
      };

      this.logger.log(`Client connected: ${client.id} (${user.email})`);
    } catch (err) {
      this.logger.warn(
        `Client ${client.id} failed to authenticate: ${err.message}`,
      );
      client.emit('error', { message: 'Invalid or expired token' });
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('message')
  handleMessage(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: any,
  ): string {
    return 'Hello world!';
  }

  emitToOrganisation(organisationId: string, event: string, data: any) {
    this.server.to(`org:${organisationId}`).emit(event, data);
  }

  emitToUser(userId: string, event: string, data: any) {
    this.server.to(`user:${userId}`).emit(event, data);
  }

  @SubscribeMessage('join-organisation')
  handleJoinOrganisation(
    @ConnectedSocket() client: Socket,
    @MessageBody() organisationId: string,
  ) {
    const user = client.data.user;

    if (!user) {
      client.emit('error', { message: 'Not authenticated' });
      return { error: 'Not authenticated' };
    }

    if (user.organisationId !== organisationId && !isAdminRole(user.role)) {
      client.emit('error', { message: 'Cannot join this organisation' });
      return { error: 'Cannot join this organisation' };
    }

    client.join(`org:${organisationId}`);
    return { status: 'joined', organisationId };
  }

  @SubscribeMessage('leave-organisation')
  handleLeaveOrganisation(
    @ConnectedSocket() client: Socket,
    @MessageBody() organisationId: string,
  ) {
    client.leave(`org:${organisationId}`);
    return { status: 'left', organisationId };
  }

  @SubscribeMessage('join-user-room')
  handleJoinUserRoom(
    @ConnectedSocket() client: Socket,
    @MessageBody() userId: string,
  ) {
    const user = client.data.user;

    if (!user) {
      client.emit('error', { message: 'Not authenticated' });
      return { error: 'Not authenticated' };
    }

    if (user.id !== userId && !isAdminRole(user.role)) {
      client.emit('error', { message: 'Cannot join this user room' });
      return { error: 'Cannot join this user room' };
    }

    client.join(`user:${userId}`);
    return { status: 'joined', userId };
  }
}
