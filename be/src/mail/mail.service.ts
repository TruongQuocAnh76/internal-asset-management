import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface BorrowMailContext {
  requesterName: string;
  requesterEmail: string;
  assetName: string;
  requestId: string;
  reason?: string;
}

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter = nodemailer.createTransport({
  host: process.env.MAIL_HOST,
  port: Number(process.env.MAIL_PORT),
  secure: false,
  ...(process.env.MAIL_USER && process.env.MAIL_PASS
    ? {
        auth: {
          user: process.env.MAIL_USER,
          pass: process.env.MAIL_PASS,
        },
      }
    : {}),
})

  private readonly from = process.env.EMAIL_FROM || 'noreply@assetmanager.com';

  private async send(to: string, subject: string, html: string) {
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
      });
      this.logger.log(`Email sent to ${to}: ${subject}`);
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}: ${error.message}`);
    }
  }

  async sendRequestSubmitted(ctx: BorrowMailContext) {
    await this.send(
      ctx.requesterEmail,
      `Borrow Request Submitted – ${ctx.assetName}`,
      `
        <h2>Request Submitted</h2>
        <p>Hi ${ctx.requesterName},</p>
        <p>Your borrow request for <strong>${ctx.assetName}</strong> has been submitted and is pending approval.</p>
        ${ctx.reason ? `<p><strong>Reason:</strong> ${ctx.reason}</p>` : ''}
        <p><strong>Request ID:</strong> ${ctx.requestId}</p>
        <hr/>
        <p style="color: #888; font-size: 12px;">Asset Management System</p>
      `,
    );
  }

  async sendRequestApproved(ctx: BorrowMailContext) {
    await this.send(
      ctx.requesterEmail,
      `Borrow Request Approved – ${ctx.assetName}`,
      `
        <h2>Request Approved</h2>
        <p>Hi ${ctx.requesterName},</p>
        <p>Your borrow request for <strong>${ctx.assetName}</strong> has been <span style="color: green; font-weight: bold;">approved</span>.</p>
        <p>Please wait for the asset to be provided to you.</p>
        <p><strong>Request ID:</strong> ${ctx.requestId}</p>
        <hr/>
        <p style="color: #888; font-size: 12px;">Asset Management System</p>
      `,
    );
  }

  async sendRequestRejected(ctx: BorrowMailContext) {
    await this.send(
      ctx.requesterEmail,
      `Borrow Request Rejected – ${ctx.assetName}`,
      `
        <h2>Request Rejected</h2>
        <p>Hi ${ctx.requesterName},</p>
        <p>Your borrow request for <strong>${ctx.assetName}</strong> has been <span style="color: red; font-weight: bold;">rejected</span>.</p>
        <p>Please contact your administrator for more details.</p>
        <p><strong>Request ID:</strong> ${ctx.requestId}</p>
        <hr/>
        <p style="color: #888; font-size: 12px;">Asset Management System</p>
      `,
    );
  }

  async sendRequestProvided(ctx: BorrowMailContext) {
    await this.send(
      ctx.requesterEmail,
      `Asset Provided – ${ctx.assetName}`,
      `
        <h2>Asset Provided</h2>
        <p>Hi ${ctx.requesterName},</p>
        <p>The asset <strong>${ctx.assetName}</strong> has been provided to you.</p>
        <p>Please make sure to return it on time.</p>
        <p><strong>Request ID:</strong> ${ctx.requestId}</p>
        <hr/>
        <p style="color: #888; font-size: 12px;">Asset Management System</p>
      `,
    );
  }

  async sendRequestReturned(ctx: BorrowMailContext) {
    await this.send(
      ctx.requesterEmail,
      `Asset Returned – ${ctx.assetName}`,
      `
        <h2>Return Confirmed</h2>
        <p>Hi ${ctx.requesterName},</p>
        <p>The return of <strong>${ctx.assetName}</strong> has been confirmed. Thank you!</p>
        <p><strong>Request ID:</strong> ${ctx.requestId}</p>
        <hr/>
        <p style="color: #888; font-size: 12px;">Asset Management System</p>
      `,
    );
  }

  async sendRequestCanceled(ctx: BorrowMailContext) {
    await this.send(
      ctx.requesterEmail,
      `Borrow Request Canceled – ${ctx.assetName}`,
      `
        <h2>Request Canceled</h2>
        <p>Hi ${ctx.requesterName},</p>
        <p>Your borrow request for <strong>${ctx.assetName}</strong> has been <strong>canceled</strong>.</p>
        <p><strong>Request ID:</strong> ${ctx.requestId}</p>
        <hr/>
        <p style="color: #888; font-size: 12px;">Asset Management System</p>
      `,
    );
  }

  async sendRequestOverdue(ctx: BorrowMailContext) {
    await this.send(
      ctx.requesterEmail,
      `⚠️ Overdue Notice – ${ctx.assetName}`,
      `
        <h2 style="color: #d97706;">Overdue Notice</h2>
        <p>Hi ${ctx.requesterName},</p>
        <p>Your borrowed asset <strong>${ctx.assetName}</strong> is now <span style="color: #d97706; font-weight: bold;">overdue</span>.</p>
        <p>Please return it as soon as possible.</p>
        <p><strong>Request ID:</strong> ${ctx.requestId}</p>
        <hr/>
        <p style="color: #888; font-size: 12px;">Asset Management System</p>
      `,
    );
  }
}
