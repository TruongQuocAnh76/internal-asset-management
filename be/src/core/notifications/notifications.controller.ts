import { Controller, Get, UseGuards } from '@nestjs/common';
import { SessionAuthGuard } from '../auth/guards/session-auth.guard';
import { NotificationsService } from './notifications.service';
import { CurrentUser } from '../auth/decorator/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
    constructor(private readonly notificationsService: NotificationsService) {}
    @Get()
    @UseGuards(SessionAuthGuard)
    getNotifications(@CurrentUser('id') userId: string) {
        return this.notificationsService.getNotifications(userId);
    }
}
