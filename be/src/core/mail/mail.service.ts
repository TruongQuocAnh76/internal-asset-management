import { Injectable, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface BorrowMailContext {
  recipientName: string;
  recipientEmail: string;
  requesterName: string;
  requesterEmail: string;
  assetName: string;
  requestId: string;
  reason?: string;
  dueDate: string;
  daysRemaining?: number;
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

  private readonly from = process.env.EMAIL_FROM;

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
      ctx.recipientEmail,
      `New Borrow Request – ${ctx.assetName}`,
      `
        <h2>New Borrow Request</h2>
        <p>Hi ${ctx.recipientName},</p>
        <p><strong>${ctx.requesterName}</strong> has submitted a borrow request for <strong>${ctx.assetName}</strong> and it requires your approval.</p>
        ${ctx.reason ? `<p><strong>Reason:</strong> ${ctx.reason}</p>` : ''}
        ${ctx.dueDate ? `<p><strong>Due Date:</strong> ${ctx.dueDate}</p>` : ''}
        <p><strong>Request ID:</strong> ${ctx.requestId}</p>
        <hr/>
        <p style="color: #888; font-size: 12px;">Asset Management System</p>
      `,
    );
  }

  async sendRequestApproved(ctx: BorrowMailContext) {
    await this.send(
      ctx.recipientEmail,
      `Borrow Request Approved – ${ctx.assetName}`,
      `
        <h2>Request Approved</h2>
        <p>Hi ${ctx.requesterName},</p>
        <p>Your borrow request for <strong>${ctx.assetName}</strong> has been <span style="color: green; font-weight: bold;">approved</span>.</p>
        <p>Please wait for the asset to be provided to you.</p>
        ${ctx.dueDate ? `<p><strong>Due Date:</strong> ${ctx.dueDate}</p>` : ''}
        <p><strong>Request ID:</strong> ${ctx.requestId}</p>
        <hr/>
        <p style="color: #888; font-size: 12px;">Asset Management System</p>
      `,
    );
  }

  async sendRequestRejected(ctx: BorrowMailContext) {
    await this.send(
      ctx.recipientEmail,
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
      ctx.recipientEmail,
      `Asset Provided – ${ctx.assetName}`,
      `
        <h2>Asset Provided</h2>
        <p>Hi ${ctx.requesterName},</p>
        <p>The asset <strong>${ctx.assetName}</strong> has been provided to you.</p>
        <p>Please make sure to return it on time.</p>
        ${ctx.dueDate ? `<p><strong>Due Date:</strong> ${ctx.dueDate}</p>` : ''}
        <p><strong>Request ID:</strong> ${ctx.requestId}</p>
        <hr/>
        <p style="color: #888; font-size: 12px;">Asset Management System</p>
      `,
    );
  }

  async sendRequestReturned(ctx: BorrowMailContext) {
    await this.send(
      ctx.recipientEmail,
      `Asset Returned – ${ctx.assetName}`,
      `
        <h2>Return Confirmed</h2>
        <p>Hi ${ctx.recipientName},</p>
        <p><strong>${ctx.requesterName}</strong> has returned <strong>${ctx.assetName}</strong>.</p>
        <p><strong>Request ID:</strong> ${ctx.requestId}</p>
        <hr/>
        <p style="color: #888; font-size: 12px;">Asset Management System</p>
      `,
    );
  }

  async sendRequestCanceled(ctx: BorrowMailContext) {
    await this.send(
      ctx.recipientEmail,
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
      ctx.recipientEmail,
      `⚠️ Overdue Notice – ${ctx.assetName}`,
      `
        <h2 style="color: #d97706;">Overdue Notice</h2>
        <p>Hi ${ctx.requesterName},</p>
        <p>Your borrowed asset <strong>${ctx.assetName}</strong> is now <span style="color: #d97706; font-weight: bold;">overdue</span>.</p>
        <p>Please return it as soon as possible.</p>
        ${ctx.dueDate ? `<p><strong>Due Date:</strong> ${ctx.dueDate}</p>` : ''}
        <p><strong>Request ID:</strong> ${ctx.requestId}</p>
        <hr/>
        <p style="color: #888; font-size: 12px;">Asset Management System</p>
      `,
    );
  }

  async sendMaintenanceNotification(ctx: {
    recipientName: string;
    recipientEmail: string;
    assetName: string;
    assetItemId: string;
    maintenanceNotes: string;
    reportedBy: string;
  }) {
    await this.send(
      ctx.recipientEmail,
      `🔧 Asset Sent to Maintenance – ${ctx.assetName}`,
      `
        <h2 style="color: #d97706;">Maintenance Notice</h2>
        <p>Hi ${ctx.recipientName},</p>
        <p>An asset item of <strong>${ctx.assetName}</strong> has been sent to maintenance by <strong>${ctx.reportedBy}</strong>.</p>
        <p><strong>Asset Item ID:</strong> ${ctx.assetItemId}</p>
        <p><strong>Notes:</strong> ${ctx.maintenanceNotes}</p>
        <hr/>
        <p style="color: #888; font-size: 12px;">Asset Management System</p>
      `,
    );
  }

  async sendMaintenanceResolved(ctx: {
    recipientName: string;
    recipientEmail: string;
    assetName: string;
    assetItemId: string;
    resolvedStatus: string;
    description?: string;
  }) {
    const statusColor = ctx.resolvedStatus === 'READY' ? 'green' : 'red';
    await this.send(
      ctx.recipientEmail,
      `Maintenance Resolved – ${ctx.assetName}`,
      `
        <h2>Maintenance Resolved</h2>
        <p>Hi ${ctx.recipientName},</p>
        <p>An asset item of <strong>${ctx.assetName}</strong> has been resolved from maintenance.</p>
        <p><strong>Asset Item ID:</strong> ${ctx.assetItemId}</p>
        <p><strong>New Status:</strong> <span style="color: ${statusColor}; font-weight: bold;">${ctx.resolvedStatus}</span></p>
        ${ctx.description ? `<p><strong>Details:</strong> ${ctx.description}</p>` : ''}
        <hr/>
        <p style="color: #888; font-size: 12px;">Asset Management System</p>
      `,
    );
  }

  async sendDueReminder(ctx: BorrowMailContext) {
    const days = ctx.daysRemaining ?? 0;
    const urgency = days <= 1 ? 'color: #dc2626;' : days <= 3 ? 'color: #d97706;' : 'color: #2563eb;';
    const label = days === 1 ? 'tomorrow' : `in ${days} days`;

    await this.send(
      ctx.recipientEmail,
      `🔔 Return Reminder – ${ctx.assetName} due ${label}`,
      `
        <h2 style="${urgency}">Return Reminder</h2>
        <p>Hi ${ctx.requesterName},</p>
        <p>This is a reminder that <strong>${ctx.assetName}</strong> is due for return <strong style="${urgency}">${label}</strong>.</p>
        <p><strong>Due Date:</strong> ${ctx.dueDate}</p>
        <p><strong>Request ID:</strong> ${ctx.requestId}</p>
        <p>Please make sure to return it on time to avoid overdue penalties.</p>
        <hr/>
        <p style="color: #888; font-size: 12px;">Asset Management System</p>
      `,
    );
  }
}
