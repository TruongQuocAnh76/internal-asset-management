import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { MailService, BorrowMailContext } from 'src/mail/mail.service';

export const NOTIFICATION_QUEUE = 'borrow-notifications';

export type NotificationJobName =
  | 'request-submitted'
  | 'request-approved'
  | 'request-rejected'
  | 'request-provided'
  | 'request-returned'
  | 'request-canceled'
  | 'request-overdue';

@Processor(NOTIFICATION_QUEUE)
export class NotificationProcessor extends WorkerHost {
  private readonly logger = new Logger(NotificationProcessor.name);

  constructor(private readonly mailService: MailService) {
    super();
  }

  async process(job: Job<BorrowMailContext, void, NotificationJobName>) {
    this.logger.log(`Processing notification job ${job.id} – ${job.name}`);

    const ctx = job.data;

    switch (job.name) {
      case 'request-submitted':
        await this.mailService.sendRequestSubmitted(ctx);
        break;
      case 'request-approved':
        await this.mailService.sendRequestApproved(ctx);
        break;
      case 'request-rejected':
        await this.mailService.sendRequestRejected(ctx);
        break;
      case 'request-provided':
        await this.mailService.sendRequestProvided(ctx);
        break;
      case 'request-returned':
        await this.mailService.sendRequestReturned(ctx);
        break;
      case 'request-canceled':
        await this.mailService.sendRequestCanceled(ctx);
        break;
      case 'request-overdue':
        await this.mailService.sendRequestOverdue(ctx);
        break;
      default:
        this.logger.warn(`Unknown job name: ${job.name}`);
    }

    return;
  }
}
