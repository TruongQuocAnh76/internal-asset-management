import { Injectable } from '@nestjs/common';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { PrismaService } from '../database/prisma.service';
import { Prisma } from '@prisma/client';

@Injectable()
export class NotificationsService {
  constructor(private prisma: PrismaService) {}

  async createNotification(body: CreateNotificationDto) {
    return await this.prisma.notifications.create({
      data: {
        user_id: body.userId,
        content: body.content,
        type: body.type,
      },
    });
  }

  async getNotifications(userId: string) {
    return await this.prisma.notifications.findMany({
      where: {
        user_id: userId,
        created_at: {
          gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // Last 30 days
        },
      },
      orderBy: {
        created_at: 'desc',
      },
    });
  }

  async markAsRead(notificationId: string) {
    try {
      return await this.prisma.notifications.update({
        where: { id: notificationId },
        data: { is_read: true },
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2025'
      ) {
        throw new Error('Notification not found');
      }
      throw error;
    }
  }

  async deleteOutdatedNotifications(thresholdDate: Date) {
    return await this.prisma.notifications.deleteMany({
      where: {
        created_at: {
          lt: thresholdDate,
        },
      },
    });
  }
}
