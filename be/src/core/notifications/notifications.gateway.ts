import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { NotificationsService } from './notifications.service';
import { Server } from 'socket.io';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { NotificationType } from '@prisma/client';

@WebSocketGateway({
  namespace: 'notifications',
})
export class NotificationsGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  constructor(private readonly notificationsService: NotificationsService) {}

  @WebSocketServer()
  server: Server;

  async notifyBorrowRequestStatusChanged(params: {
    requesterUserId: string;
    requestId: string;
    status: string;
  }) {
    const notification = await this.notificationsService.createNotification({
      userId: params.requesterUserId,
      content: `Borrow request ${params.requestId} status changed to ${params.status}.`,
      type: NotificationType.BORROW_REQUEST,
    });

    this.server.to(params.requesterUserId).emit('notification:sent', notification);
    return notification;
  }

  async notifyAssetAllocationProvided(params: {
    designatedUserId: string;
    requestId: string;
    itemLabel: string;
    itemType: 'asset' | 'kit';
  }) {
    const notification = await this.notificationsService.createNotification({
      userId: params.designatedUserId,
      content: `Your request ${params.requestId} has been provided with ${params.itemType} ${params.itemLabel}.`,
      type: NotificationType.ASSET_ALLOCATION,
    });

    this.server.to(params.designatedUserId).emit('notification:sent', notification);
    return notification;
  }

  async notifyChatGroupCreated(params: {
    participantUserIds: string[];
    groupName: string;
  }) {
    await Promise.all(
      params.participantUserIds.map(async (userId) => {
        const notification = await this.notificationsService.createNotification({
          userId,
          content: `You were added to group "${params.groupName}".`,
          type: NotificationType.CHAT_MESSAGE,
        });

        this.server.to(userId).emit('notification:sent', notification);
      }),
    );
  }

  async notifyChatMessageSent(params: {
    recipientUserIds: string[];
    senderDisplayName: string;
    messagePreview: string;
  }) {
    const preview =
      params.messagePreview.length > 120
        ? `${params.messagePreview.slice(0, 117)}...`
        : params.messagePreview;

    await Promise.all(
      params.recipientUserIds.map(async (userId) => {
        const notification = await this.notificationsService.createNotification({
          userId,
          content: `${params.senderDisplayName}: ${preview}`,
          type: NotificationType.CHAT_MESSAGE,
        });

        this.server.to(userId).emit('notification:sent', notification);
      }),
    );
  }

  async handleConnection(client: any) {
    const request = client.request as any;
    client.join(request.session.userId);
  }

  async handleDisconnect(client: any) {
    const request = client.request as any;
    client.leave(request.session.userId);
  }

  @SubscribeMessage('notification:send')
  async sendNotification(client: any, notification: CreateNotificationDto) {
    const request = client.request as any;
    const userId = request.session.userId;
    const result =
      await this.notificationsService.createNotification(notification);
    this.server.to(userId).emit('notification:sent', result);
  }

  @SubscribeMessage('notification:markAsRead')
  async markAsRead(client: any, notificationId: string) {
    const request = client.request as any;
    const userId = request.session.userId;
    try {
    await this.notificationsService.markAsRead(notificationId);
    } catch (error) {
        throw new WsException({ status: 'error', message: error.message });
    }
    this.server.to(userId).emit('notification:markedAsRead', notificationId);
  }
}
