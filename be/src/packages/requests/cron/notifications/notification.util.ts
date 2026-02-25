import { PrismaService } from 'src/core/database/prisma.service';
import { BorrowMailContext } from 'src/mail/mail.service';
import { NotificationJobName } from './notification.processor';

export interface MailRecipient {
  recipientName: string;
  recipientEmail: string;
}

type RequestContext = {
  id: string;
  reason: string | null;
  due_date: Date;
  provided_by?: string | null;
  user: { first_name: string; last_name: string; email: string };
  asset?: { name: string } | null;
  kit?: { template: { name: string } } | null;
};

/**
 * Build the non-recipient portion of BorrowMailContext from a pre-fetched request.
 */
export function buildMailContextBase(
  request: RequestContext,
): Omit<BorrowMailContext, 'recipientName' | 'recipientEmail'> {
  const assetName =
    request.asset?.name ?? request.kit?.template?.name ?? 'Unknown Asset';

  return {
    requesterName: `${request.user.first_name} ${request.user.last_name}`,
    requesterEmail: request.user.email,
    assetName,
    requestId: request.id,
    reason: request.reason ?? undefined,
    dueDate: new Date(request.due_date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    }),
  };
}

/**
 * Resolve the list of recipients for a given notification job.
 *
 * - request-submitted  → all users with role "Team Lead"
 * - request-returned   → the user who provided the asset (provided_by)
 * - everything else    → the requester
 */
export async function resolveRecipients(
  jobName: NotificationJobName,
  request: RequestContext,
  prisma: PrismaService,
): Promise<MailRecipient[]> {
  if (jobName === 'request-submitted') {
    const teamLeads = await prisma.users.findMany({
      where: { user_roles: { some: { role: { name: 'Team Lead' } } } },
      select: { first_name: true, last_name: true, email: true },
    });

    return teamLeads
      .filter((u) => !!u.email)
      .map((u) => ({
        recipientName: `${u.first_name} ${u.last_name}`,
        recipientEmail: u.email,
      }));
  }

  if (jobName === 'request-returned') {
    if (!request.provided_by) return [];

    const provider = await prisma.users.findUnique({
      where: { id: request.provided_by },
      select: { first_name: true, last_name: true, email: true },
    });

    if (!provider?.email) return [];

    return [
      {
        recipientName: `${provider.first_name} ${provider.last_name}`,
        recipientEmail: provider.email,
      },
    ];
  }

  // Default: notify the requester
  if (!request.user.email) return [];

  return [
    {
      recipientName: `${request.user.first_name} ${request.user.last_name}`,
      recipientEmail: request.user.email,
    },
  ];
}
