import type { AdminMetrics, MaintenanceJob } from '../api/types';
import type { MessageKey } from '../i18n/catalogs';

type AttentionTask = {
  id: string;
  path: string;
  label: MessageKey;
  count: number;
  maintenance?: boolean;
};

const maintenanceDestinations: Record<MaintenanceJob['job_name'], { path: string; label: MessageKey }> = {
  matches: { path: '#maintenance', label: 'common.matches' },
  photos: { path: '/photo-reconciliation', label: 'common.photos' },
  privacy: { path: '/privacy-requests', label: 'common.gdprRequests' },
  outbox: { path: '/outbox-dead-letters', label: 'common.outbox' },
  billing: { path: '/billing-reconciliation', label: 'common.stripe' },
};

export function attentionTasks(data: Pick<AdminMetrics, 'moderation' | 'photos' | 'operations'>): AttentionTask[] {
  const tasks: AttentionTask[] = [
    { id: 'reports', path: '/reports', label: 'overview.pendingReports', count: data.moderation.pending_reports },
    { id: 'content', path: '/content-moderation', label: 'overview.contentToReview', count: data.moderation.pending_content },
    { id: 'privacy', path: '/privacy-requests', label: 'overview.openGdprRequests', count: data.moderation.open_data_requests },
    {
      id: 'photos', path: '/photo-reconciliation', label: 'common.photosToReconcile',
      count: data.photos.stale_processing + data.photos.deletion_dead_letters + data.photos.deletion_without_active_event,
    },
  ];
  for (const job of data.operations.maintenance) {
    if (!job.overdue && !job.work_remaining && job.status !== 'failed') continue;
    tasks.push({
      id: 'maintenance:' + job.job_name,
      ...maintenanceDestinations[job.job_name],
      count: 1,
      maintenance: true,
    });
  }
  return tasks.filter(task => task.count > 0);
}
